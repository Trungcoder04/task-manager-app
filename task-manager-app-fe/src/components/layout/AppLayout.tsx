import React, { useState } from 'react';
import { Sidebar, TabType } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../common/Toast';
import { DashboardPage } from '../../pages/DashboardPage';
import { ProjectsPage } from '../../pages/ProjectsPage';
import { BoardPage } from '../../pages/BoardPage';
import { UserProfileModal } from '../profile/UserProfileModal';
import { MemberManagementModal } from '../projects/MemberManagementModal';
import { TaskModal } from '../tasks/TaskModal';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { Task } from '../../types/task.types';

export const AppLayout: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isQuickCreateTaskOpen, setIsQuickCreateTaskOpen] = useState(false);
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<Task | null>(null);

  // Projects state
  const {
    projects,
    activeProject,
    setActiveProject,
    isLoading: isProjectsLoading,
    error: projectsError,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateMemberRole,
  } = useProjects(user?.id);

  // Tasks state
  const {
    tasks,
    filteredTasks,
    labels,
    isLoading: isTasksLoading,
    error: tasksError,
    filters,
    setFilters,
    createTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
    addComment,
    addAttachment,
    uploadAttachment,
    deleteAttachment,
    createLabel,
    deleteLabel,
  } = useTasks(activeProject?.id, user?.id);

  const projectMembers = (activeProject?.members || [])
    .map((m) => m.user!)
    .filter(Boolean);

  const handleSelectTaskFromDashboard = (task: Task) => {
    setSelectedTaskForDrawer(task);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header
          projects={projects}
          activeProject={activeProject}
          onSelectProject={setActiveProject}
          onOpenCreateTask={() => setIsQuickCreateTaskOpen(true)}
          onOpenMembers={() => setIsMembersModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <>
              <DashboardPage
                project={activeProject}
                tasks={tasks}
                isLoading={isProjectsLoading || isTasksLoading}
                error={projectsError || tasksError}
                onSelectTask={handleSelectTaskFromDashboard}
                onGoToBoard={() => setActiveTab('board')}
                onGoToProjects={() => setActiveTab('projects')}
              />

              {activeProject && selectedTaskForDrawer && (
                <TaskModal
                  isOpen={!!selectedTaskForDrawer}
                  onClose={() => setSelectedTaskForDrawer(null)}
                  task={selectedTaskForDrawer}
                  projectId={activeProject.id}
                  members={projectMembers}
                  labels={labels}
                  onCreateTask={createTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onAddComment={addComment}
                  onAddAttachment={addAttachment}
                  onUploadAttachment={uploadAttachment}
                  onDeleteAttachment={deleteAttachment}
                />
              )}
            </>
          )}

          {activeTab === 'board' && (
            <BoardPage
              project={activeProject}
              tasks={tasks}
              filteredTasks={filteredTasks}
              labels={labels}
              filters={filters}
              isLoading={isTasksLoading}
              error={tasksError}
              onFilterChange={setFilters}
              onMoveTask={moveTaskStatus}
              onCreateTask={createTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onAddComment={addComment}
              onAddAttachment={addAttachment}
              onUploadAttachment={uploadAttachment}
              onDeleteAttachment={deleteAttachment}
              onCreateLabel={createLabel}
              onDeleteLabel={deleteLabel}
              onGoToProjects={() => setActiveTab('projects')}
              selectedTask={selectedTaskForDrawer}
              onClearSelectedTask={() => setSelectedTaskForDrawer(null)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              activeProject={activeProject}
              isLoading={isProjectsLoading}
              error={projectsError}
              onSelectProject={setActiveProject}
              onCreateProject={createProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onUpdateRole={updateMemberRole}
              onOpenBoard={() => setActiveTab('board')}
            />
          )}
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUserUpdated={updateCurrentUser}
      />

      {/* Project Members Modal */}
      {activeProject && (
        <MemberManagementModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          project={activeProject}
          onAddMember={addMember}
          onRemoveMember={removeMember}
          onUpdateRole={updateMemberRole}
        />
      )}

      {/* Quick Create Task Modal Triggered from Header */}
      {activeProject && (
        <TaskModal
          isOpen={isQuickCreateTaskOpen}
          onClose={() => setIsQuickCreateTaskOpen(false)}
          projectId={activeProject.id}
          members={projectMembers}
          labels={labels}
          initialStatus={1}
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onAddComment={addComment}
          onAddAttachment={addAttachment}
          onUploadAttachment={uploadAttachment}
          onDeleteAttachment={deleteAttachment}
        />
      )}

      {/* Global Toast Container */}
      <Toast />
    </div>
  );
};
