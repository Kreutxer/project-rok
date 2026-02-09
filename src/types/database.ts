export interface Project {
    id: string;
    created_at: string;
    name: string;
    description?: string;
}

export interface Dataset {
    id: string;
    created_at: string;
    project_id: string;
    name?: string;      // New field
    scan_date?: string; // New field
    file_name: string;
    column_headers: string[];
    json_data: Record<string, any>[];
}
