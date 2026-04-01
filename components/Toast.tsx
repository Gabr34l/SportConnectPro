import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { View, Text, Animated, Platform } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

type ToastData = {
  message: string;
  title?: string;
  type: ToastType;
};

type ToastContextType = {
  show: (data: ToastData) => void;
};

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  const show = useCallback((data: ToastData) => {
    setToast(data);
    opacity.setValue(0);
    translateY.setValue(-20);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, 3500);
  }, [opacity, translateY]);

  const bgColor = toast?.type === 'success' ? '#00C853' 
    : toast?.type === 'error' ? '#E24B4A' 
    : '#1E88E5';

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: Platform.OS === 'web' ? 40 : 70,
            alignSelf: 'center',
            minWidth: 300,
            maxWidth: '90%',
            backgroundColor: bgColor,
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 24,
            zIndex: 9999,
            opacity,
            transform: [{ translateY }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            {toast.title && (
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                {toast.title}
              </Text>
            )}
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
