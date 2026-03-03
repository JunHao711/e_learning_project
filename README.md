## System Requirements
* **Docker & Docker Compose** (Required for Redis & WebSocket handling)
* **OS**: Windows (WSL2 recommended) / macOS / Linux
* **Database**: SQLite3 (Containerized)

## Installation & Setup Guide
1. Ensure Docker Desktop is running.
2. Open terminal in the project root directory and start the containers:
   `docker-compose up -d --build`
3. Apply database migrations:
   `docker exec -it elearning_backend python manage.py migrate`
4. (Optional) Create a custom superuser:
   `docker exec -it elearning_backend python manage.py createsuperuser`

## Platform Access URLs
* **Frontend Platform**: http://localhost:5173
* **Backend API Base**: http://localhost:8000/
* **Admin Dashboard**: http://localhost:8000/admin/

## Deployment Link
* http://174.138.29.8:5173/

## Test Accounts (Pre-configured)
* **Admin** -> username: `admin` | password: `admin12345`
* **Teacher** -> username: `teacher_lim` | password: `ttt12345`
* **Student** -> username: `student_lim` | password: `ttt123456`

## Running Tests
* **Backend Unit Tests**: 
  `docker exec -it elearning_backend python manage.py test`