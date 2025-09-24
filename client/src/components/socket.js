// socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:4001"); // Backend server address

export default socket;