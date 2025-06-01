
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Edit, Trash2, Plus, Upload, File } from 'lucide-react';
import FileUploader from './FileUploader';

interface TextInput {
  id: string;
  content: string;
  isEditing: boolean;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  url: string;
}

interface Action {
  id: string;
  title: string;
  status: 'todo' | 'done';
  createdAt: Date;
  textInputs: TextInput[];
  files: FileItem[];
}

interface ActionCardProps {
  action: Action;
  onToggleStatus: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onAddTextInput: (content: string) => void;
  onUpdateTextInput: (textInputId: string, content: string) => void;
  onDeleteTextInput: (textInputId: string) => void;
  onSetTextInputEditing: (textInputId: string, isEditing: boolean) => void;
  onAddFiles: (files: FileItem[]) => void;
  onDeleteFile: (fileId: string) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onToggleStatus,
  onDelete,
  onUpdateTitle,
  onAddTextInput,
  onUpdateTextInput,
  onDeleteTextInput,
  onSetTextInputEditing,
  onAddFiles,
  onDeleteFile,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(action.title);
  const [newTextContent, setNewTextContent] = useState('');
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [editingTextInputs, setEditingTextInputs] = useState<{ [key: string]: string }>({});

  const handleTitleEdit = () => {
    if (editedTitle.trim() && editedTitle !== action.title) {
      onUpdateTitle(editedTitle.trim());
    } else {
      setEditedTitle(action.title);
    }
    setIsEditingTitle(false);
  };

  const handleAddTextInput = () => {
    if (newTextContent.trim()) {
      onAddTextInput(newTextContent);
      setNewTextContent('');
    }
  };

  const handleTextInputEdit = (textInputId: string, content: string) => {
    onUpdateTextInput(textInputId, content);
    setEditingTextInputs(prev => {
      const updated = { ...prev };
      delete updated[textInputId];
      return updated;
    });
    onSetTextInputEditing(textInputId, false);
  };

  const startEditingTextInput = (textInput: TextInput) => {
    setEditingTextInputs(prev => ({
      ...prev,
      [textInput.id]: textInput.content
    }));
    onSetTextInputEditing(textInput.id, true);
  };

  const cancelEditingTextInput = (textInputId: string) => {
    setEditingTextInputs(prev => {
      const updated = { ...prev };
      delete updated[textInputId];
      return updated;
    });
    onSetTextInputEditing(textInputId, false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📄';
    return '📁';
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg border-0 ${
      action.status === 'done' 
        ? 'bg-green-50/70 backdrop-blur-sm' 
        : 'bg-white/70 backdrop-blur-sm'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleStatus}
              className={`p-1 h-6 w-6 rounded-full border-2 transition-colors ${
                action.status === 'done'
                  ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {action.status === 'done' && <Check className="h-3 w-3" />}
            </Button>
            
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleEdit}
                onKeyPress={(e) => e.key === 'Enter' && handleTitleEdit()}
                className="font-medium"
                autoFocus
              />
            ) : (
              <h3 
                className={`font-medium cursor-pointer flex-1 ${
                  action.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
                onClick={() => setIsEditingTitle(true)}
              >
                {action.title}
              </h3>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingTitle(true)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {action.createdAt.toLocaleDateString()}</span>
          <div className="flex space-x-2">
            {action.textInputs.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {action.textInputs.length} note{action.textInputs.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {action.files.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {action.files.length} file{action.files.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Text Inputs */}
        {action.textInputs.map((textInput) => (
          <div key={textInput.id} className="group relative">
            {textInput.isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editingTextInputs[textInput.id] || textInput.content}
                  onChange={(e) => setEditingTextInputs(prev => ({
                    ...prev,
                    [textInput.id]: e.target.value
                  }))}
                  className="min-h-[60px]"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleTextInputEdit(textInput.id, editingTextInputs[textInput.id] || textInput.content)}
                    className="h-8"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelEditingTextInput(textInput.id)}
                    className="h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => startEditingTextInput(textInput)}
              >
                <p className="text-gray-700 whitespace-pre-wrap">{textInput.content}</p>
                <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTextInput(textInput.id);
                    }}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Text Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newTextContent}
            onChange={(e) => setNewTextContent(e.target.value)}
            className="min-h-[60px]"
          />
          <Button
            onClick={handleAddTextInput}
            disabled={!newTextContent.trim()}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>

        {/* Files */}
        {action.files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Files</h4>
            <div className="grid gap-2">
              {action.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-48">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500"
                    >
                      <File className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteFile(file.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        <div>
          {showFileUploader ? (
            <div className="space-y-2">
              <FileUploader 
                onFilesUploaded={(files) => {
                  onAddFiles(files);
                  setShowFileUploader(false);
                }}
                onCancel={() => setShowFileUploader(false)}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowFileUploader(true)}
              size="sm"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionCard;
