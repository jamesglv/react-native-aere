import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export type Timestamp = {
    seconds: number;
    nanoseconds?: number; // Optional, if not used
};

//LOCATIONUPDATE.TSX TYPES
export type Location = {
    latitude: number;
    longitude: number;
};

export type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };

// CHAT.TSX TYPES

export type MessageItem = {
    senderID: string;
    message: string;
    datetime: Timestamp;
};
  
export type RenderMessageProps = {
    item: MessageItem;
    index: number;
};

// CONSTANTS

//CUSTOMBUTTON.TSX TYPES
export type CustomButtonProps = {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    containerStyles?: ViewStyle;
    textStyles?: TextStyle;
};

//DELETEUSERMODAL.TSX TYPES

export type DeleteUserModalProps = {
    isVisible: boolean;
    onClose: () => void;
    goToMatches: () => void;
    backToLikes: () => void;
};

//EMPTYSTATE.TSX TYPES

export type EmptyStateProps = {
    title: string;
    subtitle: string;
};
  
//FILTERMODAL.TSX TYPES

export type FilterModalProps = {
    filterModalVisible: boolean;
    toggleFilterModal: () => void;
    minAge: number;
    maxAge: number;
    setMinAge: (age: number) => void;
    setMaxAge: (age: number) => void;
    maxDistance: number;
    setMaxDistance: (distance: number) => void;
    selectedGenders: string[];
    setSelectedGenders: (genders: string[]) => void;
    currentUserId: string;
};

//MATCHMODAL.TSX TYPES

export type MatchModalProps = {
    isVisible: boolean;
    onClose: () => void;
    goToMatches: () => void;
    backToLikes: () => void;
};

//MATCHPROFILECARD.TSX TYPES

export type Profile = {
    id: string;
    name: string;
    age: number;
    bio?: string;
    livingWith?: string[];
    photos: string[];
    privatePhotos?: string[]; // Array of image URLs
};
  
export type MatchProfileCardProps = {
    profile: Profile;
    handleRequestAccess: (profileId: string) => void;
    handleSharePrivateAlbum: (profileId: string) => void;
    hasAccess: boolean;
    hasRequested: boolean;
};

//PROFILEBUTTON.TSX TYPES

export type ProfileButtonProps = {
    title: string;
    onPress: () => void;
};


//PROFILECARD.TSX TYPES
export type ProfileCardProps = {
    profile: any;
    handleLike: (userId: string) => void;
    handleDecline: (userId: string) => void;
    handleRequestAccess: (userId: string) => void;
    handleSharePrivateAlbum: (userId: string) => void;
    setShowModal: (showModal: boolean) => void;
}

//REPORTMODAL.TSX TYPES

export type ReportModalProps = {
    isVisible: boolean;
    onClose: () => void;
    report: () => void;
    close: () => void;
    reportedUserId: string;
    matchId?: string;
};

