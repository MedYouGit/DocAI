import "./chatPage.css";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import Markdown from "react-markdown";
import { IKImage } from "imagekitio-react";
import { API_URL } from "../../utils/configs/envvars"; 

const ChatPage = () => {
  const { id: chatId } = useParams(); // Get the chatId from the URL

  const { isLoading, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () =>
      fetch(`${API_URL}/api/chats/${chatId}`, {
        credentials: "include",
      }).then((res) => res.json()),
  });

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {isLoading ? (
            "Loading..."
          ) : error ? (
            "Something went wrong!"
          ) : (
            Array.isArray(data?.history) ? (
              data?.history?.map((message, i) => (
                <div key={message._id || i} className="message-container">
                  {message.img && (
                    <IKImage
                      urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                      path={message.img}
                      height="300"
                      width="400"
                      transformation={[{ height: 300, width: 400 }]}
                      loading="lazy"
                      lqip={{ active: true, quality: 20 }}
                    />
                  )}

                  {message.parts && message.parts[0]?.text && (
                    <div
                      className={
                        message.role === "user" ? "message user" : "message"
                      }
                    >
                      <Markdown>{message.parts[0].text}</Markdown>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div>No history found or incorrect data format.</div>
            )
          )}

          {data && <NewPrompt data={data} />}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
