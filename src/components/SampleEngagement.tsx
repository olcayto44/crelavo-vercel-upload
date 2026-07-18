"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import type { SampleComment } from "@/lib/sample-videos";

type LiveComment = {
  id: string;
  author: string;
  role: "user" | "admin";
  text: string;
  likes?: number;
  createdAt?: string;
  replies?: LiveComment[];
};

type SampleEngagementProps = {
  sampleId: string;
  initialLikeCount?: number;
  initialShareCount?: number;
  initialComments?: SampleComment[];
};

function convertComment(comment: SampleComment): LiveComment {
  return {
    id: comment.id,
    author: comment.author,
    role: comment.role === "admin" ? "admin" : "user",
    text: comment.text,
    likes: comment.likes,
    createdAt: comment.createdAt,
    replies: comment.replies?.map(convertComment)
  };
}

function CommentCard({ comment, onReply }: { comment: LiveComment; onReply: (comment: LiveComment) => void }) {
  return (
    <div className={`sample-comment-card ${comment.role === "admin" ? "admin-reply" : ""}`}>
      <div className="sample-comment-head">
        <strong>{comment.author}</strong>
        <span>{comment.role === "admin" ? "Admin reply" : "User comment"}</span>
      </div>
      <p>{comment.text}</p>
      <div className="sample-comment-actions"><button type="button">Like {comment.likes ? `(${comment.likes})` : ""}</button><button type="button" onClick={() => onReply(comment)}>Reply</button></div>
      {comment.replies?.length ? <div className="sample-comment-replies">{comment.replies.map((reply) => <CommentCard comment={reply} key={reply.id} onReply={onReply} />)}</div> : null}
    </div>
  );
}

export function SampleEngagement({ sampleId, initialLikeCount = 0, initialShareCount = 0, initialComments = [] }: SampleEngagementProps) {
  const [comments, setComments] = useState<LiveComment[]>(initialComments.map(convertComment));
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [authorName, setAuthorName] = useState("Guest");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<LiveComment | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [message, setMessage] = useState("Comments are public. Admin email plus saved Admin API token marks replies as admin.");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/samples/${encodeURIComponent(sampleId)}/comments`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && Array.isArray(data?.comments)) setComments(data.comments);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [sampleId]);

  async function submitComment() {
    if (!text.trim()) {
      setMessage("Write a comment first.");
      return;
    }
    const adminToken = getStoredAdminApiToken();
    const adminPayload = adminEmail.trim() ? adminApiBody({ text, author_name: authorName, parent_comment_id: replyTo?.id }, adminEmail, adminToken) : { text, author_name: authorName, parent_comment_id: replyTo?.id };
    const response = await fetch(`/api/samples/${encodeURIComponent(sampleId)}/comments`, {
      method: "POST",
      headers: adminEmail.trim() ? adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }) : { "Content-Type": "application/json" },
      body: JSON.stringify(adminPayload)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Could not save comment.");
      return;
    }
    setText("");
    setReplyTo(null);
    setMessage("Comment saved.");
    const reload = await fetch(`/api/samples/${encodeURIComponent(sampleId)}/comments`).then((item) => item.json()).catch(() => null);
    if (Array.isArray(reload?.comments)) setComments(reload.comments);
  }

  async function likeSample() {
    const response = await fetch(`/api/samples/${encodeURIComponent(sampleId)}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await response.json().catch(() => null);
    if (response.ok && typeof data?.likeCount === "number") setLikeCount(data.likeCount || likeCount + 1);
    else setLikeCount((current) => current + 1);
  }

  async function shareSample() {
    setShareCount((current) => current + 1);
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: document.title, url }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      setMessage("Link copied for sharing.");
    }
  }

  return (
    <section className="container sample-social-wide-bar">
      <div className="sample-engagement-panel sample-engagement-panel-wide">
        <div>
          <span className="badge">Community</span>
          <strong>Like, comment or share this sample</strong>
        </div>
        <div className="sample-engagement-actions">
          <button type="button" onClick={likeSample}><Heart size={17} /> Like {likeCount ? `(${likeCount.toLocaleString()})` : ""}</button>
          <button type="button" onClick={() => setReplyTo(null)}><MessageCircle size={17} /> Comment {comments.length ? `(${comments.length})` : ""}</button>
          <button type="button" onClick={shareSample}><Share2 size={17} /> Share {shareCount ? `(${shareCount.toLocaleString()})` : ""}</button>
        </div>
        <div className="sample-comment-box sample-comment-name-row">
          <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="Your name" />
          <input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="Admin email for admin reply" />
        </div>
        {replyTo ? <p className="form-message">Replying to {replyTo.author}. <button type="button" onClick={() => setReplyTo(null)}>Cancel reply</button></p> : null}
        <div className="sample-comment-box">
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder={replyTo ? `Reply to ${replyTo.author}...` : "Write a comment for this sample..."} />
          <button type="button" onClick={submitComment}>Post</button>
        </div>
        <p className="form-message">{message}</p>
        <div className="sample-comment-thread">
          {comments.map((comment) => <CommentCard comment={comment} key={comment.id} onReply={setReplyTo} />)}
          {!comments.length ? <p>No comments yet. Be the first to comment.</p> : null}
        </div>
      </div>
    </section>
  );
}
