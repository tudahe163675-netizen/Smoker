import { Dimensions, StyleSheet } from 'react-native';

const {width: screenWidth} = Dimensions.get('window');
export const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 8,
        elevation: 3,
    },
    cardFull: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12
    },
    username: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#111827'
    },
    subText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2
    },
    content: {
        paddingHorizontal: 12,
        marginBottom: 12,
        fontSize: 15,
        color: '#374151',
        lineHeight: 20,
    },
    seeMoreText: {
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#2563eb',
        fontWeight: '500',
        marginTop: -8,
        marginBottom: 8,
    },
    imageGalleryContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    imageContainer: {
        width: screenWidth - 16,
    },
    imageCounter: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    statsContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    statsText: {
        fontSize: 13,
        color: '#6b7280',
    },
    actions: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },

    // Repost styles
    repostContainer: {
        marginHorizontal: 12,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    repostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    repostText: {
        fontSize: 13,
        color: '#6b7280',
        marginLeft: 6,
        fontWeight: '500',
    },
    originalPostContainer: {
        marginTop: 8,
    },
    originalPostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    originalPostAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    originalPostName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    originalPostTime: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    originalPostContent: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },

    // YouTube styles
    youtubeContainer: {
        marginHorizontal: 12,
        marginBottom: 12,
    },
    youtubeThumbnail: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    youtubeImage: {
        width: '100%',
        height: '100%',
    },
    youtubePlayButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    youtubeLink: {
        marginTop: 8,
        fontSize: 14,
        color: '#2563eb',
        textDecorationLine: 'underline',
    },

    // Music styles
    musicContainer: {
        marginHorizontal: 12,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    musicHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    musicThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    musicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    musicDetails: {
        marginLeft: 12,
        flex: 1,
    },
    musicTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    musicArtist: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 2,
    },
    musicGenre: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    musicDescription: {
        fontSize: 13,
        color: '#4b5563',
        marginBottom: 12,
        lineHeight: 18,
    },

    purchaseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginTop: 8,
    },
    purchaseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    // Comments Preview styles
    commentsPreview: {
        paddingHorizontal: 12,
        paddingTop: 4,
        paddingBottom: 4,
    },
    commentPreviewItem: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    commentPreviewAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    commentPreviewContent: {
        flex: 1,
    },
    commentPreviewText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
    },
    commentPreviewAuthor: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    commentPreviewTextContent: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '400',
    },
    commentPreviewLikesText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    viewAllComments: {
        marginTop: 4,
    },
    viewAllCommentsText: {
        fontSize: 13,
        color: '#6b7280',
    },
    // Repost Modal styles
    repostModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    repostModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    repostModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    repostModalCancel: {
        fontSize: 16,
        color: '#6b7280',
    },
    repostModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    repostModalSubmit: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
    },
    repostModalSubmitDisabled: {
        color: '#9ca3af',
    },
    repostModalBody: {
        padding: 16,
    },
    repostModalInput: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9fafb',
        color: '#111827',
    },
    repostOriginalPreview: {
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    repostOriginalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    repostOriginalAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    repostOriginalInfo: {
        flex: 1,
    },
    repostOriginalName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    repostOriginalTime: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    repostOriginalContent: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    menuButton: {
        padding: 8,
        borderRadius: 20,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        minWidth: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 12,
    },
    menuItemDanger: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginTop: 4,
    },
    menuItemText: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    menuItemTextDanger: {
        color: '#ef4444',
    },
});
