# 📋 Task Management System

Sistem manajemen tugas berbasis web yang dibangun dengan Laravel 11 (Backend) dan React.js (Frontend). Sistem ini dilengkapi dengan authentication, role-based permissions, dan fitur CRUD lengkap untuk mengelola proyek dan tugas.

## 🚀 Fitur Utama

### 🔐 Sistem Authentication

- **Registrasi dan Login** dengan validasi
- **Role-based Access Control** (Administrator/User)
- **Permission System** dengan Spatie Laravel Permission
- **Laravel Sanctum** untuk API authentication
- **Session Management** yang aman

### 📊 Manajemen Data

- **Projects** - Kelola proyek dengan detail lengkap
- **Tasks** - Buat dan assign tugas ke user
- **Categories** - Kategorisasi proyek dan tugas
- **Users** - Manajemen user dan role
- **Dashboard** - Overview statistik dan progress

### 🎨 Antarmuka Modern

- **Responsive Design** dengan Tailwind CSS
- **Sidebar Navigation** yang intuitif
- **Form Validation** real-time
- **Loading States** dan error handling
- **Modern UI Components**

## 🛠️ Teknologi Yang Digunakan

### Backend (Laravel 11)

- **PHP 8.2+**
- **Laravel 11** - Framework PHP
- **MySQL** - Database
- **Laravel Sanctum** - API Authentication
- **Spatie Laravel Permission** - Role & Permission
- **Laravel Excel** - Import/Export

### Frontend (React.js)

- **React 18** - UI Framework
- **React Router** - Navigation
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling
- **Context API** - State Management

## 📋 Persyaratan Sistem

### Backend Requirements

- PHP >= 8.2
- Composer
- MySQL/MariaDB
- Laravel 11 compatible server

### Frontend Requirements

- Node.js >= 16.x
- npm atau yarn

## ⚡ Instalasi dan Setup

### 1. Clone Repository

```bash
git clone https://github.com/irawan1212/Task_Management.git
cd Task_Management
```

### 2. Setup Backend (Laravel)

#### 2.1 Masuk ke direktori Backend

```bash
cd Backend
```

#### 2.2 Install Dependencies

```bash
composer install
```

#### 2.3 Copy Environment File

```bash
copy .env.example .env
```

#### 2.4 Konfigurasi Database

Edit file `.env` dan sesuaikan konfigurasi database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_management
DB_USERNAME=root
DB_PASSWORD=
```

#### 2.5 Generate Application Key

```bash
php artisan key:generate
```

#### 2.6 Jalankan Migration dan Seeder

```bash
php artisan migrate
php artisan db:seed
```

#### 2.7 Create Storage Link

```bash
php artisan storage:link
```

#### 2.8 Start Laravel Server

```bash
php artisan serve
```

Backend akan berjalan di: `http://localhost:8000`

### 3. Setup Frontend (React)

#### 3.1 Buka Terminal Baru dan Masuk ke Frontend

```bash
cd Frontend
```

#### 3.2 Install Dependencies

```bash
npm install
```

#### 3.3 Start Development Server

```bash
npm start
```

Frontend akan berjalan di: `http://localhost:3000`

## 👥 Default User Accounts

Setelah menjalankan seeder, tersedia akun default:

### Administrator

- **Email:** `admin@example.com`
- **Password:** `password`
- **Role:** Administrator (Full Access)

### Regular User

- **Email:** `user@example.com`
- **Password:** `password`
- **Role:** User (Limited Access)

## 📖 Cara Penggunaan

### 🔑 Login dan Authentication

1. **Akses Frontend:** Buka `http://localhost:3000`
2. **Login:** Gunakan akun admin atau user di atas
3. **Dashboard:** Setelah login, Anda akan diarahkan ke dashboard

### 📊 Dashboard Overview

Dashboard menampilkan:

- **Statistik Project** - Total proyek aktif/selesai
- **Task Summary** - Ringkasan tugas berdasarkan status
- **Recent Activities** - Aktivitas terbaru
- **Quick Actions** - Shortcut untuk fungsi utama

### 🗂️ Manajemen Projects

#### Membuat Project Baru

1. Klik **"Projects"** di sidebar
2. Klik tombol **"Create Project"**
3. Isi form dengan data:
   - **Name:** Nama proyek
   - **Description:** Deskripsi detail
   - **Status:** Planning/In Progress/Completed
   - **Priority:** Low/Medium/High
   - **Start Date & End Date**
   - **Manager:** Pilih user sebagai manager
   - **Category:** Pilih kategori proyek

#### Mengedit Project

1. Di halaman Project List, klik tombol **"Edit"**
2. Update data yang diperlukan
3. Klik **"Update Project"**

#### Melihat Detail Project

1. Klik nama project atau tombol **"View"**
2. Halaman detail menampilkan:
   - Informasi lengkap project
   - Daftar tasks dalam project
   - Progress tracking

### ✅ Manajemen Tasks

#### Membuat Task Baru

1. Klik **"Tasks"** di sidebar
2. Klik **"Create Task"**
3. Isi form task:
   - **Title:** Judul task
   - **Description:** Deskripsi detail
   - **Project:** Pilih project terkait
   - **Category:** Pilih kategori
   - **Assignee:** Assign ke user
   - **Priority:** Low/Medium/High
   - **Status:** To Do/In Progress/Completed
   - **Due Date:** Deadline task

#### Update Status Task

1. Di Task List, klik dropdown status
2. Pilih status baru (To Do/In Progress/Completed)
3. Status akan tersimpan otomatis

#### Task Assignment

- **Administrator:** Dapat assign task ke semua user
- **User:** Hanya dapat melihat task yang di-assign ke mereka

### 🏷️ Manajemen Categories

#### Membuat Category

1. Klik **"Categories"** di sidebar
2. Klik **"Create Category"**
3. Isi data category:
   - **Name:** Nama kategori
   - **Description:** Deskripsi
   - **Color:** Pilih warna untuk identifikasi

#### Penggunaan Categories

- Categories dapat digunakan untuk projects dan tasks
- Membantu dalam filtering dan organizing
- Visual identification dengan color coding

### 👤 Manajemen Users (Administrator Only)

#### Membuat User Baru

1. Klik **"Users"** di sidebar
2. Klik **"Create User"**
3. Isi data user:
   - **Name:** Nama lengkap
   - **Email:** Email address
   - **Password:** Password (min 8 karakter)
   - **Role:** Pilih Administrator atau User

#### Mengedit User

1. Di User List, klik **"Edit"**
2. Update data yang diperlukan
3. Dapat mengubah role user

### 🛡️ Sistem Role dan Permission

#### Administrator Role

**Full Access:**

- ✅ Manage semua projects
- ✅ Manage semua tasks
- ✅ Manage users
- ✅ Manage categories
- ✅ Manage roles
- ✅ View all data

#### User Role

**Limited Access:**

- ✅ View projects (yang di-assign)
- ✅ Manage own tasks
- ✅ View categories
- ❌ Cannot manage users
- ❌ Cannot manage roles
- ❌ Limited data access

### 🔍 Fitur Pencarian dan Filter

#### Project/Task Search

- **Search Bar:** Cari berdasarkan nama/deskripsi
- **Status Filter:** Filter berdasarkan status
- **Category Filter:** Filter berdasarkan kategori
- **Date Range:** Filter berdasarkan tanggal

#### Sorting Options

- Sort berdasarkan: Name, Date, Priority, Status
- Ascending/Descending order

### 📱 Responsive Design

Sistem mendukung akses dari berbagai device:

- **Desktop:** Full featured interface
- **Tablet:** Optimized layout
- **Mobile:** Touch-friendly navigation

## 🔧 Konfigurasi Lanjutan

### Environment Variables

#### Backend (.env)

```env
APP_NAME="Task Management"
APP_ENV=local
APP_DEBUG=true
APP_TIMEZONE=Asia/Jakarta

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_management
DB_USERNAME=root
DB_PASSWORD=

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000

# Mail (optional)
MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
```

### API Endpoints

Base URL: `http://localhost:8000/api`

#### Authentication

- `POST /register` - Registrasi user baru
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /user` - Get user data

#### Projects

- `GET /projects` - List semua projects
- `POST /projects` - Buat project baru
- `GET /projects/{id}` - Detail project
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Hapus project

#### Tasks

- `GET /tasks` - List semua tasks
- `POST /tasks` - Buat task baru
- `GET /tasks/{id}` - Detail task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Hapus task

#### Categories

- `GET /categories` - List categories
- `POST /categories` - Buat category
- `PUT /categories/{id}` - Update category
- `DELETE /categories/{id}` - Hapus category

#### Users (Admin only)

- `GET /users` - List users
- `POST /users` - Buat user baru
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Hapus user

#### Roles (Admin only)

- `GET /roles` - List roles
- `POST /roles` - Buat role baru
- `PUT /roles/{id}` - Update role

## 🐛 Troubleshooting

### Common Issues

#### 1. Permission Denied Error

```bash
# Fix storage permissions
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

#### 2. Sanctum Token Issues

```bash
# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

#### 3. Database Connection Error

- Pastikan MySQL service berjalan
- Cek konfigurasi database di `.env`
- Pastikan database sudah dibuat

#### 4. NPM Install Issues

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules
npm install
```

#### 5. CORS Issues

- Pastikan `SANCTUM_STATEFUL_DOMAINS` di `.env` sudah benar
- Frontend harus berjalan di domain yang terdaftar

### Log Files

#### Backend Logs

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Check specific errors
grep "ERROR" storage/logs/laravel.log
```

#### Frontend Logs

- Buka Developer Tools di browser (F12)
- Check Console tab untuk JavaScript errors
- Check Network tab untuk API call issues

## 🚀 Production Deployment

### Backend Deployment

#### 1. Server Requirements

- PHP 8.2+
- Composer
- MySQL/MariaDB
- Web server (Apache/Nginx)

#### 2. Environment Setup

```bash
# Set production environment
APP_ENV=production
APP_DEBUG=false

# Set secure APP_KEY
php artisan key:generate --force

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### 3. Database Setup

```bash
php artisan migrate --force
php artisan db:seed --force
```

### Frontend Deployment

#### 1. Build for Production

```bash
npm run build
```

#### 2. Deploy Build Files

- Upload `build/` folder ke web server
- Configure web server untuk serve React app
- Set environment variables untuk production API URL

## 📚 Dokumentasi API

### Authentication Headers

Semua protected endpoints membutuhkan header:

```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

### Response Format

```json
{
  "data": {
    // Response data
  },
  "message": "Success message",
  "status": 200
}
```

### Error Response

```json
{
  "message": "Error message",
  "errors": {
    "field": ["Validation error message"]
  },
  "status": 422
}
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Project ini menggunakan MIT License. Lihat file `LICENSE` untuk detail.

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. **Issues:** Buat issue di GitHub repository
2. **Documentation:** Baca dokumentasi ini dengan teliti
3. **Logs:** Check log files untuk error details
4. **Community:** Diskusi di GitHub Discussions

## 🎉 Terima Kasih!

Terima kasih telah menggunakan Task Management System. Sistem ini dibuat untuk membantu tim dalam mengelola proyek dan tugas dengan lebih efisien.

**Happy Coding! 🚀**
