import { useState } from "react";
import axios from "axios";
import ZoomMtgEmbedded from "@zoom/meetingsdk/embedded";
import "./App.css";

function App() {
  const client = ZoomMtgEmbedded.createClient();
  const authEndpoint = "http://localhost:8080/lives";

  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");
  const [inMeeting, setInMeeting] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ENABLED" | "DISABLED">("DISABLED"); // inicializa como DISABLED

  const getSignature = async () => {
    try {
      const res = await axios.post(
        authEndpoint,
        { topic, agenda, status }, // cria live com status inicial
        { headers: { "X-Platform-Id": "alfahibrid.io" } }
      );

      const { meetingNumber, signature, password, id } = res.data.data;
      setLiveId(id);

      startMeeting({
        meetingNumber,
        signature,
        password,
        userName: "Professor",
      });
    } catch (err) {
      console.error("Erro ao buscar assinatura:", err);
    }
  };

  function startMeeting({
    meetingNumber,
    signature,
    password,
    userName,
  }: {
    meetingNumber: string;
    signature: string;
    password: string;
    userName: string;
  }) {
    const meetingSDKElement = document.getElementById("meetingSDKElement")!;

    client
      .init({
        zoomAppRoot: meetingSDKElement,
        language: "en-US",
      })
      .then(() =>
        client.join({
          signature,
          meetingNumber,
          password,
          userName,
        })
      )
      .then(() => {
        console.log("Entrou na reunião com sucesso 🚀");
        setInMeeting(true);
      })
      .catch((error: any) => {
        console.error("Erro ao entrar na reunião:", error);
      });
  }

  async function updateStatus(newStatus: "ENABLED" | "DISABLED") {
    if (!liveId) return;
    try {
      await axios.put(
        `${authEndpoint}/${liveId}`,
        { status: newStatus },
        { headers: { "X-Platform-Id": "alfahibrid.io" } }
      );
      setStatus(newStatus);
      console.log(`Live agora está ${newStatus}`);
    } catch (err) {
      console.error("Erro ao atualizar status da live:", err);
    }
  }

  async function endMeeting() {
    try {
      await client.endMeeting();

      if (liveId) {
        await axios.put(
          `${authEndpoint}/${liveId}`,
          { finished: true },
          { headers: { "X-Platform-Id": "alfahibrid.io" } }
        );
      }

      console.log("Reunião encerrada 🚪");
      setInMeeting(false);
    } catch (err) {
      console.error("Erro ao encerrar reunião:", err);
    }
  }

  return (
    <div className="App" style={{ width: "80vw" }}>
      <main>
        <h1>Zoom Meeting SDK Sample React</h1>
        <h2>Área do Professor</h2>

        {!inMeeting ? (
          <div className="form">
            <input
              type="text"
              placeholder="Topic"
              value={topic}
              style={{
                padding: "10px"
              }}
              onChange={(e) => setTopic(e.target.value)}
            />
            <input
              type="text"
              placeholder="Agenda"
              value={agenda}
              style={{
                padding: "10px"
              }}
              onChange={(e) => setAgenda(e.target.value)}
            />
            <button onClick={getSignature}>Criar e Iniciar Live</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ marginRight: "10px" }}>
                Status do Aluno:
              </label>
              <input
                type="checkbox"
                checked={status === "ENABLED"}
                onChange={(e) =>
                  updateStatus(e.target.checked ? "ENABLED" : "DISABLED")
                }
              />
              {status}
            </div>

            <button
              onClick={endMeeting}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                background: "red",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Encerrar Live
            </button>
          </>
        )}

        <div
          id="meetingSDKElement"
          style={{
            width: "auto",
            height: "60vh",
            margin: "20px auto",
            border: "2px solid #ccc",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}
        />
      </main>
    </div>
  );
}

export default App;
