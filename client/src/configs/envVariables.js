const APP_ENV = process.env.REACT_APP_ENV || "local";
let APP_HOST = "";

switch (APP_ENV) {
  case "local":
    APP_HOST = "http://localhost:5000";
    break;
  case "prod":
    APP_HOST = "https://ping-chat-backend.onrender.com";
    break;
  default:
    APP_HOST = "http://localhost:5000";
    break;
}

export default APP_HOST;
