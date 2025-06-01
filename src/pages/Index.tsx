
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
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            loadUserActions(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setActions([]);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        loadUserActions(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const loadUserActions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading actions:', error);
        return;
      }

      // Convert to local format for now (we'll migrate fully later)
      const formattedActions: Action[] = data.map(action => ({
        id: action.id,
        title: action.title,
        status: action.status as 'todo' | 'done',
        createdAt: new Date(action.created_at),
        textInputs: [], // We'll implement this later
        files: [] // We'll implement this later
      }));

      setActions(formattedActions);
    } catch (error) {
      console.error('Error loading actions:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
        return;
      }

      setUser(null);
      setSession(null);
      setProfile(null);
      setActions([]);
      
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const createAction = async () => {
    if (!newActionTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('actions')
        .insert([
          {
            user_id: user.id,
            title: newActionTitle,
            status: 'todo'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating action:', error);
        toast({
          title: "Error",
          description: "Failed to create action",
          variant: "destructive",
        });
        return;
      }

      const newAction: Action = {
        id: data.id,
        title: data.title,
        status: data.status as 'todo' | 'done',
        createdAt: new Date(data.created_at),
        textInputs: [],
        files: []
      };

      setActions(prev => [newAction, ...prev]);
      setNewActionTitle('');

      toast({
        title: "Action created",
        description: `"${newActionTitle}" has been added to your tasks`,
      });
    } catch (error) {
      console.error('Error creating action:', error);
    }
  };

  const updateAction = async (actionId: string, updates: { title?: string; status?: 'todo' | 'done' }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', actionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating action:', error);
        return;
      }

      setActions(prev => 
        prev.map(action =>
          action.id === actionId ? { ...action, ...updates } : action
        )
      );
    } catch (error) {
      console.error('Error updating action:', error);
    }
  };

  const deleteAction = async (actionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', actionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting action:', error);
        toast({
          title: "Error",
          description: "Failed to delete action",
          variant: "destructive",
        });
        return;
      }

      setActions(prev => prev.filter(action => action.id !== actionId));

      toast({
        title: "Action deleted",
        description: "The action has been removed",
      });
    } catch (error) {
      console.error('Error deleting action:', error);
    }
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

  // Placeholder functions for text inputs and files (to be implemented later)
  const addTextInputToAction = (actionId: string, content: string) => {
    // TODO: Implement with Supabase
  };

  const updateTextInput = (actionId: string, textInputId: string, content: string) => {
    // TODO: Implement with Supabase
  };

  const deleteTextInput = (actionId: string, textInputId: string) => {
    // TODO: Implement with Supabase
  };

  const setTextInputEditing = (actionId: string, textInputId: string, isEditing: boolean) => {
    // TODO: Implement with Supabase
  };

  const addFilesToAction = (actionId: string, files: FileItem[]) => {
    // TODO: Implement with Supabase
  };

  const deleteFileFromAction = (actionId: string, fileId: string) => {
    // TODO: Implement with Supabase
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
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
                  {profile?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.username || user.email}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
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
