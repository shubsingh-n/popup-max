
export type ComponentType =
    | 'email'
    | 'phone'
    | 'number'
    | 'button'
    | 'image'
    | 'longText'
    | 'shortText'
    | 'timer'
    | 'date'
    | 'title'
    | 'description'
    | 'marquee'; // New

export interface PopupComponent {
    id: string;
    type: ComponentType;
    label: string;
    pageIndex?: number; // New: For multi-step
    content: {
        text?: string;
        placeholder?: string;
        src?: string;
        url?: string;
        required?: boolean; // Basic required
        defaultValue?: string;
        // Timer specific
        targetDate?: string;
        // Date specific
        format?: string;
        // Marquee specific
        speed?: number;
        direction?: 'left' | 'right';
        // Button specific
        action?: 'submit' | 'next' | 'prev' | 'close' | 'link' | 'trigger_popup';
        actionUrl?: string;
        triggerPopupId?: string; // New: For cross-popup triggers
        hidden?: boolean;
        // Validation (New)
        validation?: {
            required?: boolean;
            min?: number; // Min length or min value
            max?: number;
            pattern?: string; // Regex
        };
    };
    style: {
        color?: string;
        backgroundColor?: string;
        fontSize?: string;
        fontWeight?: string;
        textAlign?: 'left' | 'center' | 'right';
        padding?: string;
        borderRadius?: string;
        border?: string; // Shorthand
        borderColor?: string; // New
        borderWidth?: string; // New
        width?: string;
        height?: string;
        marginTop?: string;
        marginBottom?: string;
    };
}

export interface PopupSettings {
    width: string;
    height: string;
    backgroundColor: string;
    borderRadius: string;
    padding: string;
    overlayColor: string; // The generic overlay
    closeButtonColor: string;
    backgroundImage?: string;
    closeButton?: {
        show: boolean;
        position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
        color: string;
    };
    closeOnOverlayClick?: boolean;
    thankYou?: {
        enabled: boolean;
        title: string;
        description: string;
        displayDuration: number; // in seconds
        useCustomPage?: boolean; // New
        pageIndex?: number; // New
    };
    thankYouPageIndex?: number; // New: Simplified top-level ref
    overState?: {
        enabled: boolean;
        text: string;
        showClose: boolean;
        style: {
            backgroundColor?: string;
            color?: string;
            borderRadius?: string;
            padding?: string;
            fontSize?: string;
            fontWeight?: string;
        };
        triggers: {
            positionDesktop: string;
            positionMobile: string;
            displayMode: 'always' | 'closed_not_filled' | 'after_delay';
            delay?: number;
        };
    };
}
