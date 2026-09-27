# Expense Tracker

A simple full-stack expense tracking application built with **HTML, CSS, JavaScript, Bootstrap, Node.js, Express, and PostgreSQL**.

The application allows users to view, add, edit, and delete expenses through a simple web interface connected to a REST API.

## 🛠️ Technologies

### Frontend

* HTML
* CSS
* JavaScript
* Bootstrap

### Backend

* Node.js
* Express.js
* PostgreSQL
* `pg`
* CORS
* dotenv

### Development

* Nodemon
* Thunder Client

## ✨ Features

* View all expenses
* Add new expenses
* Edit existing expenses
* Delete expenses
* Expense categories:

  * Food
  * Transport
  * Bills
  * Entertainment
  * Other
* PostgreSQL database for persistent data storage
* RESTful API
* Input validation
* Responsive interface using Bootstrap

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/mzarifeh05/Expense-Tracker
cd expense-tracker
```

### 2. Install backend dependencies

```bash
npm install
```

If dependencies have not been installed yet:

```bash
npm install express cors pg dotenv
npm install --save-dev nodemon
```

### 3. Create the PostgreSQL database

Create a PostgreSQL database named:

```text
expense_tracker
```

Then run the SQL commands in `schema.sql` to create the `expenses` table and insert the sample data.

### 4. Configure environment variables

Create a `.env` file in the backend directory:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=expense_tracker
```

Replace `your_password` with your PostgreSQL password.

**Do not commit your `.env` file to GitHub.**

### 5. Start the backend

For development with Nodemon:

```bash
npm run dev
```

Or:

```bash
npx nodemon server.js
```
