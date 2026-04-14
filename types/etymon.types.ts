// Core data structures
export interface WordNode {
    id: string;
    word: string;
    language: Language;
    era: HistoricalEra;
    definition: string;
    etymology: string;
    position: Position;
    parentId?: string;
    childrenIds: string[];
    metadata: WordMetadata;
}

export interface Position {
    x: number;
    y: number;
}

export interface WordMetadata {
    firstRecorded?: number; // Year
    lastRecorded?: number;
    frequency?: number; // 0-1 scale of common usage
    region?: string[];
    partOfSpeech: PartOfSpeech;
}

export enum Language {
    PROTO_INDO_EUROPEAN = 'PIE',
    LATIN = 'Latin',
    GREEK = 'Greek',
    OLD_ENGLISH = 'Old English',
    MIDDLE_ENGLISH = 'Middle English',
    MODERN_ENGLISH = 'Modern English',
    OLD_FRENCH = 'Old French',
    PROTO_GERMANIC = 'Proto-Germanic',
    OLD_NORSE = 'Old Norse'
}

export enum HistoricalEra {
    ANCIENT = 'ancient', // Before 500 CE
    MEDIEVAL = 'medieval', // 500-1500 CE
    EARLY_MODERN = 'earlyModern', // 1500-1800 CE
    MODERN = 'modern' // 1800-present
}

export enum PartOfSpeech {
    NOUN = 'noun',
    VERB = 'verb',
    ADJECTIVE = 'adjective',
    ADVERB = 'adverb',
    PREPOSITION = 'preposition',
    CONJUNCTION = 'conjunction'
}

// Graph edge structure
export interface EtymologyEdge {
    id: string;
    source: string;
    target: string;
    relationshipType: RelationshipType;
    confidence: number; // 0-1
    yearOfTransition?: number;
}

export enum RelationshipType {
    DERIVED_FROM = 'derivedFrom',
    COGNATE = 'cognate',
    BORROWED = 'borrowed',
    CALQUE = 'calque'
}

// AI Response structure
export interface AIEtymologyResponse {
    word: string;
    language: Language;
    era: HistoricalEra;
    definition: string;
    etymology: string;
    confidence: number;
    ancestors: AncestorWord[];
    descendants: DescendantWord[];
    cognates: CognateWord[];
    metadata: WordMetadata;
}

export interface AncestorWord {
    word: string;
    language: Language;
    era: HistoricalEra;
    definition: string;
    relationshipType: RelationshipType;
    confidence: number;
    yearApprox?: number;
}

export interface DescendantWord {
    word: string;
    language: Language;
    definition: string;
    era: HistoricalEra;
    relationshipType: RelationshipType;
    confidence: number;
    yearApprox?: number;
}

export interface CognateWord {
    word: string;
    language: Language;
    definition: string;
    sharedRoot: string;
}

// Application state
export interface EtymonState {
    nodes: Map<string, WordNode>;
    edges: Map<string, EtymologyEdge>;
    selectedNodeId: string | null;
    viewport: Viewport;
    timeSliderValue: number; // 0-1 representing 1200AD to 2024AD
    isLoading: boolean;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

// Dijkstra pathfinding result
export interface EtymologyPath {
    path: string[]; // Array of word IDs
    edges: string[]; // Array of edge IDs
    totalDistance: number;
    explanation: string[];
}