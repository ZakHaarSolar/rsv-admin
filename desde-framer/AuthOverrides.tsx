import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"

export const useAuthStore = createStore({
    isModalOpen: false,
    modalView: "login" as "login" | "register",
})

export function useAuthModalState() {
    const [store, setStore] = useAuthStore()
    return {
        isOpen: store.isModalOpen,
        view: store.modalView,
        open: (view: "login" | "register" = "login") =>
            setStore({ isModalOpen: true, modalView: view }),
        close: () => setStore({ isModalOpen: false }),
    }
}
