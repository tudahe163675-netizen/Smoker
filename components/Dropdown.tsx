import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
    Dimensions,
} from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

type OptionItem = {
    value: string;
    label: string;
};

interface DropDownProps {
    data: OptionItem[];
    onChange: (item: OptionItem) => void;
    placeholder: string;
}

export default function Dropdown({
                                     data,
                                     onChange,
                                     placeholder,
                                 }: DropDownProps) {
    const [expanded, setExpanded] = useState(false);
    const [value, setValue] = useState("");
    const [top, setTop] = useState(0);
    const [direction, setDirection] = useState<"up" | "down">("down");

    const buttonRef = useRef<View>(null);

    const toggleExpanded = useCallback(() => {
        if (buttonRef.current) {
            buttonRef.current.measure((fx, fy, width, height, px, py) => {
                const screenHeight = Dimensions.get("window").height;
                const dropdownHeight = 250;

                const bottomSpace = screenHeight - (py + height);

                if (bottomSpace < dropdownHeight) {
                    setDirection("up");
                    setTop(py);
                } else {
                    setDirection("down");
                    setTop(py + height);
                }
            });
        }

        setExpanded((e) => !e);
    }, []);

    const onSelect = useCallback((item: OptionItem) => {
        onChange(item);
        setValue(item.label);
        setExpanded(false);
    }, []);

    return (
        <View ref={buttonRef}>
            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={toggleExpanded}
            >
                <Text style={styles.text}>{value || placeholder}</Text>

                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#000"
                />

            </TouchableOpacity>

            {expanded && (
                <Modal visible transparent animationType="fade">
                    <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
                        <View style={styles.backdrop}>
                            <View
                                style={[
                                    styles.options,
                                    direction === "down"
                                        ? { top }
                                        : {
                                            top: undefined,
                                            bottom: Dimensions.get("window").height - top,
                                        },
                                ]}
                            >
                                <FlatList
                                    keyExtractor={(item) => item.value}
                                    data={data}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            style={styles.optionItem}
                                            onPress={() => onSelect(item)}
                                        >
                                            <Text>{item.label}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ItemSeparatorComponent={() => (
                                        <View style={styles.separator} />
                                    )}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 50,
        justifyContent: "space-between",
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    text: {
        fontSize: 15,
        opacity: 0.8,
    },
    backdrop: {
        flex: 1,
    },
    options: {
        position: "absolute",
        backgroundColor: "white",
        width: "90%",
        left: "5%",
        padding: 10,
        borderRadius: 6,
        maxHeight: 250,
    },
    optionItem: {
        height: 40,
        justifyContent: "center",
    },
    separator: {
        height: 4,
    },
});
