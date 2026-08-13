"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Button from "./Components/Button";

const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : "";

export default function Home() {
  const handleDelete = async (id: string) => {
  try {
    const res = await fetch(`/api/data/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    setData((prev) => prev.filter((item: any) => item._id !== id));
  } catch (err) {
    console.error(err);
    setError("Failed to delete data");
  }
};
  const [data, setData] = useState<any[]>([]);
  const [messages, setMessages] = useState<
  { username: string; message: string }[]
>([]); 
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("general");
  const [typingUsers, setTypingUsers] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const formData = new FormData();

    formData.append("title", title);
    formData.append("status", status);

    if (image) {
      formData.append("image", image);
    }

    const res = await fetch("/api/data", {
      method: "POST",
      body: formData,
    });

    const newData = await res.json();

    setData((prev: any) => [...prev, newData]);

    setTitle("");
    setStatus("");
    setImage(null);
  } catch (err) {
    console.error(err);
  }
};
  useEffect(() => {
  const socket = socketRef.current;

  if (socket && socket.connected && room) {
    socket.emit("join-room", room);
  }
}, [room]);
  
  useEffect(() => {
  const socket = io("http://127.0.0.1:5000");
  socketRef.current = socket;
  
  socket.on("connect", () => {
  socket.emit("join-room", room);
});
  

  socket.on("chat-message", (message) => {
  console.log("Received:", message);
  setMessages((prev) => [...prev, message]);
});
  socket.on("typing", ({ username }) => {
  setTypingUsers(username);
  setIsTyping(true);
});
  socket.on("stop-typing", () => {
  setIsTyping(false);
  setTypingUsers("");  
});

  return () => {
    socket.disconnect();
  };
}, []);

  useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("Fetching...");

      const res = await fetch(`${API_URL}/api/data`);
      if (!res.ok) {
  throw new Error(`HTTP ${res.status}`);
}
      console.log("Status:", res.status);

      const result = await res.json();

      console.log("Result:", result);

      setData(result);
    } 
    catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
  try {
    const res = await fetch(`/api/data/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    setData((prev) => prev.filter((item: any) => item._id !== id));
  } catch (err) {
    console.error(err);
    setError("Failed to delete data");
  }
};

  fetchData();
}, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "20px",
      }}
    >
      <h1>Sprint 11 - Component Testing</h1>

      <Button text="Click Me" />
      <form onSubmit={handleSubmit}>

      <input
  type="text"
  placeholder="Title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

<input
  type="text"
  placeholder="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
/>
<input
  type="file"
  accept="image/*"
  onChange={(e) => setImage(e.target.files?.[0] || null)}
/>

<button type="submit">Add Data</button>
</form>

      {loading && <p>Loading...</p>}

      {error && <p>{error}</p>}

      <div>
  
  <select
  value={room}
  onChange={(e) => setRoom(e.target.value)}
>
  <option value="general">General</option>
  <option value="tech">Tech</option>
</select>

  <input
  type="text"
  placeholder="Your name"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
  {typingUsers && <p>{typingUsers} is typing...</p>}
  <input
  type="text"
  id="messageInput"
  placeholder="Type a message"
  onChange={() => {
  if (socketRef.current) {
    socketRef.current.emit("typing", {
      username,
    });

    setTimeout(() => {
      socketRef.current?.emit("stop-typing");
    }, 1000);
  }
}}
/>

  <button
    onClick={() => {
      const input = document.getElementById(
        "messageInput"
      ) as HTMLInputElement;

      socketRef.current?.emit("chat-message", {
  username,
  message: input.value,
  room,
});

      input.value = "";
    }}
  >
    Send Message
  </button>
</div>

      <div>
  {messages.map((message, index) => (
    <p key={index}>
  <strong>{message.username}:</strong> {message.message}
</p>
  ))}
</div>

      <ul>
        {data.map((item: any) => (
  <li key={item._id}>
    {item.title} - {item.status}
    {item.image && (
  <img
    src={item.image}
    alt={item.title}
    width="100"
  />
)}

    <button
      onClick={() => handleDelete(item._id)}
      style={{ marginLeft: "10px" }}
    >
      Delete
    </button>
  </li>
))}
      </ul>
    </main>
  );
}