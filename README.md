# CANOPY CASH  Flow Management (CCFM) System

## Overview
The CANOPY CASH Flow Management (CCFM) System is a web-based application designed to streamline and optimize the management of critical care resources and patient flow in healthcare settings. This system helps healthcare providers efficiently manage patient care, resources, and workflows in critical care units.

## Features
- User Authentication System
- Scenario-based Critical Care Management
- Patient Flow Tracking
- Resource Management
- Interactive Dashboard
- PDF Report Generation

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)
- **PDF Generation**: html2canvas, jsPDF

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Sarang-droid/CCFM-syste-.git
cd CCFM-syste-
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add the following:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the application:
```bash
npm start
```

## Project Structure
```
├── public/             # Static files
│   ├── CCFM.html      # Main application page
│   ├── login.html     # Login page
│   ├── register.html  # Registration page
│   └── styles.css     # Stylesheets
├── routes/            # API routes
├── utils/            # Utility functions
└── server.js         # Main server file
```

## API Endpoints
- `/auth/register` - User registration
- `/auth/login` - User authentication
- `/ccfm/*` - CCFM related operations
- `/scenario/*` - Scenario management

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
- GitHub: [@Sarang-droid](https://github.com/Sarang-droid)

## Acknowledgments
- Thanks to all contributors who have helped with the development
- Special thanks to healthcare professionals for their input and feedback 
