import { FileType } from '../services/file';

export interface Document {
  id: string;
  name: string;
  type: FileType;
  url: string;
  created_at: string;
}

export interface DocumentListProps {
  documents: Document[];
  onDelete: (ids: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
} 