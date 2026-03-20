import { Bookmark, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Surface';
import { formatRelativeDate } from '@/lib/format';
import { Post, ReactionType } from '@/types/domain';

interface PostCardProps {
  post: Post;
  onReact: (reaction: ReactionType) => Promise<unknown> | void;
  onSave: () => Promise<unknown> | void;
  onComment?: () => void;
}

export function PostCard({ post, onReact, onSave, onComment }: PostCardProps) {
  return (
    <Card className="post-card">
      <header className="post-card__header">
        <div className="post-card__author">
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} size="sm" />
          <div>
            <strong>{post.author.displayName}</strong>
            <p>
              @{post.author.username} · {formatRelativeDate(post.createdAt)}
            </p>
          </div>
        </div>
        {post.groupName ? <span className="tag tag--soft">{post.groupName}</span> : null}
      </header>

      <div className="post-card__body">
        <span className="tag">{post.category || 'Publicación'}</span>
        <p>{post.content}</p>
        {post.bibleVerse ? <blockquote>{post.bibleVerse}</blockquote> : null}
        {post.imageUrl ? <img className="post-card__image" src={post.imageUrl} alt={post.category || 'Post'} /> : null}
      </div>

      <div className="reaction-row">
        {post.reactions.map((reaction) => (
          <button
            key={reaction.type}
            type="button"
            className={`reaction-chip${reaction.reactedByMe ? ' is-active' : ''}`}
            onClick={() => onReact(reaction.type)}
          >
            <span>{reaction.label}</span>
            <strong>{reaction.count}</strong>
          </button>
        ))}
      </div>

      <footer className="post-card__footer">
        <div className="inline-actions">
          <button type="button" className="icon-link icon-link--text" onClick={onComment}>
            <MessageCircle size={16} />
            <span>{post.comments.length} comentarios</span>
          </button>
          <button type="button" className="icon-link icon-link--text" onClick={onSave}>
            <Bookmark size={16} />
            <span>{post.savedByMe ? 'Guardado' : 'Guardar'}</span>
          </button>
          <Link className="icon-link icon-link--text" to={`/app/posts/${post.id}`}>
            <Share2 size={16} />
            <span>Ver detalle</span>
          </Link>
        </div>

        {post.comments[0] ? (
          <div className="comment-preview">
            <strong>{post.comments[0].author.displayName}</strong>
            <span>{post.comments[0].content}</span>
          </div>
        ) : (
          <Button variant="ghost" onClick={onComment}>
            Escribir un comentario
          </Button>
        )}
      </footer>
    </Card>
  );
}
