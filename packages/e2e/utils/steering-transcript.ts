import { convertClaudeCodeTranscript } from "../../shared/src/claudecode";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getTestDb } from "./db";
import { createTranscript, testId } from "./factories";

export async function seedSteeringTranscript(includeSteering = true) {
  const id = testId();
  const records: Record<string, unknown>[] = [
    { type: "user", message: { role: "user", content: "Build the dashboard" } },
    {
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "Inspecting the workspace." }] },
    },
    {
      type: "assistant",
      message: {
        role: "assistant",
        content: [{ type: "tool_use", id: "tool-1", name: "Bash", input: { command: "ls" } }],
      },
    },
    ...(includeSteering
      ? [
          {
            type: "attachment",
            attachment: { type: "queued_command", commandMode: "prompt", prompt: "Use the local preview server." },
          },
        ]
      : []),
    { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Checking the preview." }] } },
    {
      type: "assistant",
      message: {
        role: "assistant",
        content: [{ type: "tool_use", id: "tool-2", name: "Bash", input: { command: "pwd" } }],
      },
    },
    { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Dashboard complete." }] } },
    { type: "user", message: { role: "user", content: "Explain the changes" } },
    { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Everything is ready." }] } },
  ];
  const result = convertClaudeCodeTranscript(
    records.map((record, index) => ({
      ...record,
      uuid: `${id}-${index}`,
      sessionId: `steering-${id}`,
      timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
      cwd: "/tmp/steering-test",
    })),
  );
  if (!result) throw new Error("Failed to convert steering fixture");

  const transcript = createTranscript(id, {
    transcriptId: result.transcript.id,
    preview: result.transcript.preview,
    messageCount: result.transcript.messageCount,
    repoId: null,
  });
  const storageDirectory = path.resolve(import.meta.dirname!, "../../server/.data/storage/private/test-user-id");
  await mkdir(storageDirectory, { recursive: true });
  await writeFile(path.join(storageDirectory, `${result.transcript.id}.json`), JSON.stringify(result.transcript));
  const { db, sqlite, schema } = getTestDb();
  try {
    db.insert(schema.transcripts).values(transcript).run();
  } finally {
    sqlite.close();
  }
  return transcript.id;
}
