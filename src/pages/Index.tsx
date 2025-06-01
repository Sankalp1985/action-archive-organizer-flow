
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Upload, Plus, Edit, Trash2, User, LogOut, Check, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import FileUploader from '@/components/FileUploader';
import ActionCard from '@/components/ActionCard';
import LoginForm from '@/components/LoginForm';

interface User {
  id: string;
  username: string;
  email: string;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  url: string;
}

interface TextInput {
  id: string;
  content: string;
  isEditing: boolean;
}

interface Action {
  id: string;
  title: string;
  status: 'todo' | 'done';
  createdAt: Date;
  textInputs: TextInput[];
  files: FileItem[];
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [showFileUploader, setShowFileUploader] = useState(false);

  // Load user and actions from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadUserActions(user.id);
    }
  }, []);

  const loadUserActions = (userId: string) => {
    const userActionsKey = `actions_${userId}`;
    const savedActions = localStorage.getItem(userActionsKey);
    if (savedActions) {
      const parsedActions = JSON.parse(savedActions).map((action: any) => ({
        ...action,
        createdAt: new Date(action.createdAt)
      }));
      setActions(parsedActions);
    }
  };

  const saveUserActions = (userId: string, userActions: Action[]) => {
    const userActionsKey = `actions_${userId}`;
    localStorage.setItem(userActionsKey, JSON.stringify(userActions));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    loadUserActions(user.id);
    toast({
      title: "Welcome back!",
      description: `Logged in as ${user.username}`,
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActions([]);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const createAction = () => {
    if (!newActionTitle.trim() || !currentUser) return;

    const newAction: Action = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newActionTitle,
      status: 'todo',
      createdAt: new Date(),
      textInputs: [],
      files: []
    };

    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    saveUserActions(currentUser.id, updatedActions);
    setNewActionTitle('');

    toast({
      title: "Action created",
      description: `"${newActionTitle}" has been added to your tasks`,
    });
  };

  const updateAction = (actionId: string, updates: Partial<Action>) => {
    if (!currentUser) return;

    const updatedActions = actions.map(action =>
      action.id === actionId ? { ...action, ...updates } : action
    );
    setActions(updatedActions);
    saveUserActions(currentUser.id, updatedActions);
  };

  const deleteAction = (actionId: string) => {
    if (!currentUser) return;

    const updatedActions = actions.filter(action => action.id !== actionId);
    setActions(updatedActions);
    saveUserActions(currentUser.id, updatedActions);

    toast({
      title: "Action deleted",
      description: "The action has been removed",
    });
  };

  const toggleActionStatus = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const newStatus = action.status === 'todo' ? 'done' : 'todo';
    updateAction(actionId, { status: newStatus });

    toast({
      title: newStatus === 'done' ? "Task completed!" : "Task reopened",
      description: `"${action.title}" is now ${newStatus}`,
    });
  };

  const addTextInputToAction = (actionId: string, content: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action || !content.trim()) return;

    const newTextInput: TextInput = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      isEditing: false
    };

    const updatedTextInputs = [...action.textInputs, newTextInput];
    updateAction(actionId, { textInputs: updatedTextInputs });
  };

  const updateTextInput = (actionId: string, textInputId: string, content: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const updatedTextInputs = action.textInputs.map(input =>
      input.id === textInputId ? { ...input, content, isEditing: false } : input
    );
    updateAction(actionId, { textInputs: updatedTextInputs });
  };

  const deleteTextInput = (actionId: string, textInputId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const updatedTextInputs = action.textInputs.filter(input => input.id !== textInputId);
    updateAction(actionId, { textInputs: updatedTextInputs });
  };

  const setTextInputEditing = (actionId: string, textInputId: string, isEditing: boolean) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const updatedTextInputs = action.textInputs.map(input =>
      input.id === textInputId ? { ...input, isEditing } : input
    );
    updateAction(actionId, { textInputs: updatedTextInputs });
  };

  const addFilesToAction = (actionId: string, files: FileItem[]) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const updatedFiles = [...action.files, ...files];
    updateAction(actionId, { files: updatedFiles });

    toast({
      title: "Files uploaded",
      description: `${files.length} file(s) added to the action`,
    });
  };

  const deleteFileFromAction = (actionId: string, fileId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const updatedFiles = action.files.filter(file => file.id !== fileId);
    updateAction(actionId, { files: updatedFiles });
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const todoActions = actions.filter(action => action.status === 'todo');
  const doneActions = actions.filter(action => action.status === 'done');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                TaskFlow
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {currentUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Action */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-blue-600" />
              Create New Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter action title..."
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createAction()}
                className="flex-1"
              />
              <Button 
                onClick={createAction}
                disabled={!newActionTitle.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* To Do Column */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">To Do</h2>
              <Badge variant="secondary" className="ml-3">
                {todoActions.length}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {todoActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onToggleStatus={() => toggleActionStatus(action.id)}
                  onDelete={() => deleteAction(action.id)}
                  onUpdateTitle={(title) => updateAction(action.id, { title })}
                  onAddTextInput={(content) => addTextInputToAction(action.id, content)}
                  onUpdateTextInput={(textInputId, content) => updateTextInput(action.id, textInputId, content)}
                  onDeleteTextInput={(textInputId) => deleteTextInput(action.id, textInputId)}
                  onSetTextInputEditing={(textInputId, isEditing) => setTextInputEditing(action.id, textInputId, isEditing)}
                  onAddFiles={(files) => addFilesToAction(action.id, files)}
                  onDeleteFile={(fileId) => deleteFileFromAction(action.id, fileId)}
                />
              ))}
              
              {todoActions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Check className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No tasks yet. Create your first action above!</p>
                </div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Done</h2>
              <Badge variant="secondary" className="ml-3">
                {doneActions.length}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {doneActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onToggleStatus={() => toggleActionStatus(action.id)}
                  onDelete={() => deleteAction(action.id)}
                  onUpdateTitle={(title) => updateAction(action.id, { title })}
                  onAddTextInput={(content) => addTextInputToAction(action.id, content)}
                  onUpdateTextInput={(textInputId, content) => updateTextInput(action.id, textInputId, content)}
                  onDeleteTextInput={(textInputId) => deleteTextInput(action.id, textInputId)}
                  onSetTextInputEditing={(textInputId, isEditing) => setTextInputEditing(action.id, textInputId, isEditing)}
                  onAddFiles={(files) => addFilesToAction(action.id, files)}
                  onDeleteFile={(fileId) => deleteFileFromAction(action.id, fileId)}
                />
              ))}
              
              {doneActions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-gray-400" />
                  </div>
                  <p>Completed tasks will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
