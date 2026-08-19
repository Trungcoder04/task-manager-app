export interface Label {
  id: number;
  projectId: number;
  name: string;
  colorCode?: string;
}

export interface CreateLabelRequest {
  projectId: number;
  name: string;
  colorCode?: string;
}
