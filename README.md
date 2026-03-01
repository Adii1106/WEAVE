#### Deployed Link : https://weave-frontend.onrender.com/
#### PPT and Video Link : https://drive.google.com/drive/folders/1EEk-gRsKvH9WVagDyCuhqETN-1xga0in
# WEAVE: Decentralized Real-Time Collaborative Whiteboard

## 1. Problem
Modern collaborative whiteboards rely on centralized servers for every interaction (drawing, cursor movement), causing:
- High latency for distributed users  
- Expensive server infrastructure  
- Single point of failure  

**Target Users:** Remote teams, designers, students  
**Existing Gaps:** Poor performance on low-bandwidth networks, costly WebSocket infrastructure, database conflicts during concurrent edits  

---

## 2. Approach
The core issue is centralized conflict resolution.

**Solution:** Use CRDTs (Conflict-Free Replicated Data Types) to enable a Peer-to-Peer (P2P) architecture via WebRTC, removing the need for a central synchronization server.

---

## 3. Proposed Solution
A **hybrid architecture**:
- Centralized backend → Authentication & room management  
- P2P WebRTC → Real-time data synchronization  

**Core Idea:** Decentralize the drawing engine for near zero-latency collaboration while keeping centralized security and persistence.

### Key Features:
- Infinite canvas (Tldraw)
- Conflict-free concurrent editing (Yjs CRDTs)
- Live multiplayer cursors & awareness
- AI-powered sticky note summarization (LLM integration)

---

## 4. System Architecture

**High-Level Flow:**

User → React/Tldraw → P2P WebRTC (Sync)  
OR  
User → REST API → Node Backend → MongoDB  

**Description:**
- Backend handles authentication and room metadata.
- After joining a room, browsers establish WebRTC peer connections.
- Drawing actions update a local `Y.Doc` CRDT, which calculates deltas and syncs P2P without routing through the Node server.

---

## 5. Database Design

Minimal persistent state for efficiency:

- **Users:** ID, Name, Email, PasswordHash  
- **Rooms:** RoomID, HostID, CreatedAt, SerializedCRDTState  

---

## 6. Dataset
Real-time user-generated text (sticky notes and canvas text nodes).

**Reason:** Brainstorming sessions produce unstructured data, ideal for AI-powered summarization.

---

## 7. Model
**LLM Integration (OpenAI / Gemini API)**  

**Purpose:** Summarize and extract insights from unstructured brainstorming content without training a custom ML model.

---

## 8. Technology Stack

**Frontend:** React (Vite), Tldraw, Yjs, y-webrtc  
**Backend:** Node.js, Express.js  
**Database:** MongoDB  
**Deployment:** Vercel (Frontend), Render/Railway (Backend)

---


## 9. API Documentation & Testing

### API Endpoints List

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/signup` | POST | User registration (Name, Email, Password) |
| `/api/auth/login` | POST | User login (Email, Password) |
| `/api/upload` | POST | Multi-part form-data for asset/image uploads |
| `/health` | GET | Server health check and uptime status |

### API Testing Screenshots
*(Add Postman or Thunder Client screenshots here to show successful auth and upload responses)*

---

## 10. Module-wise Development & Deliverables

### Checkpoint 1: Research & Planning
**Deliverables:**
- Systems diagram for Hybrid Sync architecture.
- Research on CRDTs (Yjs) vs. Operations Transforms (OTs).
- Tech stack selection for high-performance drawing.

### Checkpoint 2: Backend Development
**Deliverables:**
- Express server with RESTful Auth and Upload routes.
- MongoDB Atlas integration for persistent metadata storage.
- WebSocket-based WebRTC signaling server.

### Checkpoint 3: Frontend Development
**Deliverables:**
- Tldraw canvas engine integration.
- Custom premium UI components with glassmorphism.
- Real-time P2P chat system using Yjs Shared Arrays.

### Checkpoint 4: CRDT Sync Optimization
**Deliverables:**
- Optimized WebRTC connection management via awareness logic.
- Snapshot system for time-travel history playback.
- Low-latency data synchronization for drawing objects.

### Checkpoint 5: Hybrid Logic Integration
**Deliverables:**
- Unified store combining P2P drawing with API-based asset syncing.
- Logic for handling large file uploads during live sessions.

### Checkpoint 6: Deployment
**Deliverables:**
- Frontend and Backend production builds on Render.
- Environment variable configuration for production signaling URLs.

---

## 11. End-to-End Workflow

1.  **Auth Gate**: User registers or logs in via a glassmorphic UI.
2.  **Room Creation**: User creates a unique session ID or joins an existing one.
3.  **Discovery**: High-performance P2P discovery via our signaling server.
4.  **Collaboration**: Real-time sync of drawings and chat via Yjs CRDTs.
5.  **Asset Sync**: Peer-to-peer awareness handles metadata, while heavy assets (images) are fetched via our Hybrid API.
6.  **Persistence**: Final session state is serialized and saved periodically to MongoDB.

---

## 12. Demo & Video

- **Live Demo Link:** [https://weave-frontend.onrender.com/](https://weave-frontend.onrender.com/)
- **Demo Video Link:** [Google Drive - WEAVE Demo](https://drive.google.com/drive/folders/1EEk-gRsKvH9WVagDyCuhqETN-1xga0in)
- **GitHub Repository:** [Adii1106/WEAVE](https://github.com/Adii1106/WEAVE)

---

## 13. Hackathon Deliverables Summary

- Fully decentralized whiteboard engine (No central drawing server).
- Secure Authentication system with JWT.
- P2P Real-time Chat & Voice awareness.
- Time-Travel snapshot history playback.
- Hybrid Image Upload & Synchronization.

---

## 14. Team Roles & Responsibilities

| Member Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Vansh** | Frontend & UI Lead | Redesigned the Landing Page, Global Styles, and Decentralized Chat UI. |
| **Aditya Mishra** | P2P & Core Engine Lead | Architected the Yjs Sync Hook, Tldraw integration, and Snapshot history engine. |
| **Premansh Behl** | Backend & Asset Lead | Built the Node/Express server, MongoDB models, and Multer upload service. |

---

## 15. Future Scope & Scalability

**Short-Term:**
- Mobile-optimized tablet view for drawing with styluses.
- Native PDF annotation support via hybrid workers.

**Long-Term:**
- Infinite canvas persistence across browser sessions.
- AI-powered brainstorming auto-summarization of sticky notes.

---

## 16. Known Limitations

- **Scalability**: High peer counts (50+) on a single board can increase local CPU load due to CRDT merging.
- **Privacy**: Currently requires a STUN/TURN server for users behind strict enterprise firewalls.

---

## 17. Impact

- **90% Infrastructure Cost Reduction**: No expensive WebSocket instances per user.
- **True Decentralization**: User data syncs directly, ensuring higher privacy and zero "middle-man" delay.
- **Resilience**: Even if the signaling server goes down after peers discover each other, the session continues P2P.
