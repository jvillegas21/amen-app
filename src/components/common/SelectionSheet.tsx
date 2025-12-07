import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface Option {
    label: string;
    value: string;
    icon?: string;
}

interface SelectionSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: Option[];
    onSelect: (value: string) => void;
    selectedValue?: string;
}

const SelectionSheet: React.FC<SelectionSheetProps> = ({
    visible,
    onClose,
    title,
    options,
    onSelect,
    selectedValue,
}) => {
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleSelect = (value: string) => {
        onSelect(value);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        {options.map((option, index) => {
                            const isSelected = option.value === selectedValue;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.option,
                                        index !== options.length - 1 && styles.optionBorder,
                                        isSelected && styles.selectedOption,
                                    ]}
                                    onPress={() => handleSelect(option.value)}
                                >
                                    <View style={styles.optionContent}>
                                        {option.icon && (
                                            <Ionicons
                                                name={option.icon as any}
                                                size={24}
                                                color={isSelected ? theme.colors.primary[600] : theme.colors.text.secondary}
                                                style={styles.optionIcon}
                                            />
                                        )}
                                        <Text
                                            style={[
                                                styles.optionLabel,
                                                isSelected && styles.selectedOptionLabel,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={24}
                                            color={theme.colors.primary[600]}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={styles.bottomSpacer} />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheet: {
        backgroundColor: theme.colors.background.primary,
        borderTopLeftRadius: theme.borderRadius['2xl'],
        borderTopRightRadius: theme.borderRadius['2xl'],
        paddingTop: theme.spacing[2],
        maxHeight: '80%',
        ...theme.shadows['2xl'],
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing[2],
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.neutral[300],
        borderRadius: theme.borderRadius.full,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.primary,
    },
    title: {
        ...theme.typography.heading.h4,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing[1],
    },
    optionsContainer: {
        padding: theme.spacing[4],
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing[4],
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.primary,
    },
    selectedOption: {
        backgroundColor: theme.colors.primary[50],
        marginHorizontal: -theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        marginRight: theme.spacing[3],
    },
    optionLabel: {
        ...theme.typography.body.large,
        color: theme.colors.text.primary,
    },
    selectedOptionLabel: {
        color: theme.colors.primary[700],
        fontWeight: '600',
    },
    bottomSpacer: {
        height: Platform.OS === 'ios' ? 34 : 20, // Safe area for home indicator
    },
});

export default SelectionSheet;
