import { JS_KEYWORDS } from "@/lib/consts";

function getRandomKeyword() {
  return JS_KEYWORDS[Math.floor(Math.random() * JS_KEYWORDS.length)];
}

interface BlogPostOGProps {
  title: string;
  date?: Date;
  tags?: string[];
}

export default function blogPostTemplate({
  title,
  date,
  tags,
}: BlogPostOGProps) {
  const randomKeyword = getRandomKeyword();

  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Berkeley Mono",
        backgroundColor: "#ffffff",
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
        backgroundSize: "20px 20px",
        padding: "60px",
      }}
    >
      {/* Header with author name */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#000000",
            margin: "0",
          }}
        >
          Ethan Niser
        </h1>
        <div
          style={{
            fontSize: "24px",
            color: "#666666",
            fontStyle: "italic",
          }}
        >
          {randomKeyword}
        </div>
      </div>

      {/* Title section */}
      <h2
        style={{
          fontSize: "56px",
          fontFamily: "Berkeley Mono Bold",
          fontWeight: "bold",
          color: "#000000",
          lineHeight: "1.1",
          margin: "40px 0",
          textAlign: "left",
        }}
      >
        {title}
      </h2>

      {/* Footer with date and tags */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {date && (
            <div
              style={{
                fontSize: "24px",
                color: "#666666",
                fontStyle: "italic",
              }}
            >
              {date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}
          {tags && tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    padding: "8px 16px",
                    fontSize: "20px",
                    fontWeight: "medium",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Decorative element */}
        <div
          style={{
            width: "100px",
            height: "4px",
            backgroundColor: "#000000",
            transform: "skew(-10deg)",
          }}
        />
      </div>
    </div>
  );
}
