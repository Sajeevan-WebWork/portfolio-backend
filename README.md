# Portfolio Backend

This is the backend server for my personal portfolio website. It handles business logic, API requests, and interactions with services like sending emails from the contact form.

## Features

*   **Contact Form Submission:** Handles POST requests from the portfolio contact form and sends the message to a designated email address using Nodemailer.
*   **RESTful API:** Provides endpoints for portfolio projects, skills, and other dynamic content.
*   (Add other features as you build them)

## Technologies Used

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web framework for Node.js (assumed).
*   **Nodemailer:** Module to send emails.
*   **dotenv:** For managing environment variables.
*   (Add other technologies like database, authentication libraries, etc.)

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/portfolio-backend.git
    cd portfolio-backend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

### Configuration

This project uses environment variables to handle sensitive information and configuration settings.

1.  Create a `.env` file in the root of the project:
    ```sh
    touch .env
    ```

2.  Add the following environment variables to your `.env` file. This is necessary for the contact form email functionality.

    ```ini
    # .env

    # Nodemailer/Gmail Configuration
    # The email address you want to send contact form messages FROM
    ADMIN_EMAIL=your-email@gmail.com

    # The password for the email account.
    # IMPORTANT: For Gmail, it's highly recommended to use an "App Password" instead of your regular password.
    # See Google's documentation: https://support.google.com/accounts/answer/185833
    ADMIN_EMAIL_PASSWORD=your-gmail-app-password

    # Server Configuration
    PORT=5000
    ```

---

## Usage

### Running the Development Server

To start the server, run the following command:

```sh
npm start
```

The server will start on the port specified in your `.env` file (e.g., `http://localhost:5000`).

### API Endpoints

Here are the primary endpoints available (examples):

*   `POST /api/contact`
    *   Handles sending an email from the contact form.
    *   **Body:** `{ "name": "John Doe", "email": "john@example.com", "message": "Hello!" }`

*(Add more endpoint documentation as you create them)*