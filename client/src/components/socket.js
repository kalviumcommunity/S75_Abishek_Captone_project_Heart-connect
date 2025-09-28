// socket.js
  // Reuse the centralized socket configured with environment variables
  // This avoids hardcoding localhost and works for both dev and production
  import socket from "../utils/socket";

  export default socket;