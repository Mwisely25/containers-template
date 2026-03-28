package main

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"
)

type Job struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Company     string    `json:"company"`
	Location    string    `json:"location"`
	Description string    `json:"description"`
	SourceName  string    `json:"sourceName,omitempty"`
	SourceBody  string    `json:"sourceBody,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

type JobStore struct {
	mu   sync.RWMutex
	jobs map[string]Job
}

func NewJobStore() *JobStore {
	return &JobStore{jobs: make(map[string]Job)}
}

func (s *JobStore) Save(job Job) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
}

func (s *JobStore) All() []Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]Job, 0, len(s.jobs))
	for _, j := range s.jobs {
		items = append(items, j)
	}
	sort.Slice(items, func(i, j int) bool {
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})
	return items
}

func (s *JobStore) Search(query string) []Job {
	normalized := strings.ToLower(strings.TrimSpace(query))
	if normalized == "" {
		return s.All()
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	matches := []Job{}
	for _, j := range s.jobs {
		haystack := strings.ToLower(strings.Join([]string{
			j.Title,
			j.Company,
			j.Location,
			j.Description,
			j.SourceBody,
		}, " "))
		if strings.Contains(haystack, normalized) {
			matches = append(matches, j)
		}
	}
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].CreatedAt.After(matches[j].CreatedAt)
	})
	return matches
}

func (s *JobStore) ByID(id string) (Job, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job, ok := s.jobs[id]
	return job, ok
}

var store = NewJobStore()

func handler(w http.ResponseWriter, r *http.Request) {
	message := os.Getenv("MESSAGE")
	instanceId := os.Getenv("CLOUDFLARE_DURABLE_OBJECT_ID")
	fmt.Fprintf(w, "Hi, I'm a container and this is my message: \"%s\", my instance ID is: %s", message, instanceId)
}

func jobsPageHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, jobsPageHTML)
}

func jobsCollectionHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		query := r.URL.Query().Get("q")
		writeJSON(w, http.StatusOK, map[string]any{
			"query": query,
			"count": len(store.Search(query)),
			"jobs":  store.Search(query),
		})
	case http.MethodPost:
		job, err := parseJobFromRequest(r)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		store.Save(job)
		writeJSON(w, http.StatusCreated, job)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func jobsDetailHandler(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/container/api/jobs/")
	id = strings.TrimPrefix(id, "/api/jobs/")
	if id == "" {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	job, ok := store.ByID(id)
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "job not found"})
		return
	}
	writeJSON(w, http.StatusOK, job)
}

func parseJobFromRequest(r *http.Request) (Job, error) {
	contentType := r.Header.Get("Content-Type")
	if strings.Contains(contentType, "application/json") {
		return parseJSONJob(r.Body)
	}
	return parseMultipartJob(r)
}

func parseJSONJob(body io.Reader) (Job, error) {
	var payload struct {
		Title       string `json:"title"`
		Company     string `json:"company"`
		Location    string `json:"location"`
		Description string `json:"description"`
		SourceName  string `json:"sourceName"`
		SourceBody  string `json:"sourceBody"`
	}
	if err := json.NewDecoder(body).Decode(&payload); err != nil {
		return Job{}, fmt.Errorf("invalid JSON payload")
	}
	return buildJob(payload.Title, payload.Company, payload.Location, payload.Description, payload.SourceName, payload.SourceBody)
}

func parseMultipartJob(r *http.Request) (Job, error) {
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		return Job{}, fmt.Errorf("invalid multipart form")
	}

	title := r.FormValue("title")
	company := r.FormValue("company")
	location := r.FormValue("location")
	description := r.FormValue("description")

	sourceName := ""
	sourceBody := ""
	file, header, err := r.FormFile("job_file")
	if err == nil {
		defer file.Close()
		sourceName, sourceBody = extractFileContent(file, header)
	}

	return buildJob(title, company, location, description, sourceName, sourceBody)
}

func extractFileContent(file multipart.File, header *multipart.FileHeader) (string, string) {
	body, err := io.ReadAll(io.LimitReader(file, 1<<20))
	if err != nil {
		return header.Filename, ""
	}
	return header.Filename, strings.TrimSpace(string(body))
}

func buildJob(title, company, location, description, sourceName, sourceBody string) (Job, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return Job{}, fmt.Errorf("title is required")
	}

	now := time.Now().UTC()
	id := fmt.Sprintf("job-%d", now.UnixNano())

	return Job{
		ID:          id,
		Title:       title,
		Company:     strings.TrimSpace(company),
		Location:    strings.TrimSpace(location),
		Description: strings.TrimSpace(description),
		SourceName:  strings.TrimSpace(sourceName),
		SourceBody:  strings.TrimSpace(sourceBody),
		CreatedAt:   now,
	}, nil
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, fmt.Sprintf("json encode error: %s", html.EscapeString(err.Error())), http.StatusInternalServerError)
	}
}

func errorHandler(w http.ResponseWriter, r *http.Request) {
	panic("This is a panic")
}

func main() {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	router := http.NewServeMux()
	router.HandleFunc("/", handler)
	router.HandleFunc("/container", handler)
	router.HandleFunc("/container/jobs", jobsPageHandler)
	router.HandleFunc("/jobs", jobsPageHandler)
	router.HandleFunc("/container/api/jobs", jobsCollectionHandler)
	router.HandleFunc("/api/jobs", jobsCollectionHandler)
	router.HandleFunc("/container/api/jobs/", jobsDetailHandler)
	router.HandleFunc("/api/jobs/", jobsDetailHandler)
	router.HandleFunc("/error", errorHandler)

	server := &http.Server{Addr: ":8080", Handler: router}

	go func() {
		log.Printf("Server listening on %s\n", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	sig := <-stop
	log.Printf("Received signal (%s), shutting down server...", sig)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal(err)
	}

	log.Println("Server shutdown successfully")
}

const jobsPageHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Crew Proof - Jobs Knowledge Base</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: Inter, Arial, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 2rem 1rem 3rem; }
    h1 { margin-bottom: .5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 1rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 1rem; }
    label { display: block; margin-bottom: .5rem; font-size: .9rem; }
    input, textarea, button { width: 100%; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; padding: .65rem .75rem; box-sizing: border-box; }
    textarea { min-height: 110px; resize: vertical; }
    button { margin-top: .75rem; background: #2563eb; border-color: #2563eb; font-weight: 600; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    .jobs { margin-top: 1.25rem; display: grid; gap: .75rem; }
    .job { border: 1px solid #334155; border-radius: 12px; padding: .75rem; background: #0b1221; }
    .meta { color: #94a3b8; font-size: .85rem; }
    .status { min-height: 1.5rem; color: #93c5fd; }
    .empty { color: #94a3b8; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Crew Proof • Jobs Info Hub</h1>
    <p>Upload, search, and find all information on jobs in one place.</p>

    <div class="grid">
      <section class="card">
        <h2>Add / Upload Job</h2>
        <form id="job-form">
          <label>Title<input name="title" required placeholder="Site Superintendent" /></label>
          <label>Company<input name="company" placeholder="Crew Proof" /></label>
          <label>Location<input name="location" placeholder="Austin, TX" /></label>
          <label>Description<textarea name="description" placeholder="Paste notes, responsibilities, requirements..."></textarea></label>
          <label>Upload file (txt, markdown, or notes)<input type="file" name="job_file" /></label>
          <button type="submit">Save Job Information</button>
        </form>
        <p class="status" id="save-status"></p>
      </section>

      <section class="card">
        <h2>Search Jobs Information</h2>
        <label>Search<input id="search-input" placeholder="Try: superintendent, OSHA, Austin" /></label>
        <button id="search-btn" type="button">Search</button>
        <p class="status" id="search-status"></p>
      </section>
    </div>

    <section class="jobs" id="jobs-list"></section>
  </div>

  <script>
    const form = document.getElementById('job-form');
    const saveStatus = document.getElementById('save-status');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchStatus = document.getElementById('search-status');
    const jobsList = document.getElementById('jobs-list');

    function renderJobs(jobs) {
      if (!jobs || jobs.length === 0) {
        jobsList.innerHTML = '<div class="empty">No jobs found yet.</div>';
        return;
      }
      jobsList.innerHTML = jobs.map((job) => {
        const sourceName = job.sourceName
          ? '<p class="meta">Uploaded file: ' + escapeHtml(job.sourceName) + '</p>'
          : '';
        const sourceBody = job.sourceBody
          ? '<details><summary>Uploaded content</summary><pre>' + escapeHtml(job.sourceBody) + '</pre></details>'
          : '';
        return (
          '<article class="job">' +
            '<h3>' + escapeHtml(job.title) + '</h3>' +
            '<p class="meta">' +
              escapeHtml(job.company || 'Unknown company') + ' • ' +
              escapeHtml(job.location || 'No location') + ' • ' +
              new Date(job.createdAt).toLocaleString() +
            '</p>' +
            '<p>' + escapeHtml(job.description || 'No description provided.') + '</p>' +
            sourceName +
            sourceBody +
          '</article>'
        );
      }).join('');
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>\"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    async function loadJobs(query = '') {
      const url = query ? '/container/api/jobs?q=' + encodeURIComponent(query) : '/container/api/jobs';
      const res = await fetch(url);
      const data = await res.json();
      renderJobs(data.jobs || []);
      searchStatus.textContent = 'Found ' + (data.count || 0) + ' matching job records.';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      saveStatus.textContent = 'Saving...';
      const formData = new FormData(form);
      const res = await fetch('/container/api/jobs', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unable to save job record.' }));
        saveStatus.textContent = err.error || 'Unable to save job record.';
        return;
      }
      saveStatus.textContent = 'Saved job information successfully.';
      form.reset();
      await loadJobs(searchInput.value.trim());
    });

    searchBtn.addEventListener('click', async () => {
      await loadJobs(searchInput.value.trim());
    });

    searchInput.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        await loadJobs(searchInput.value.trim());
      }
    });

    loadJobs();
  </script>
</body>
</html>`
