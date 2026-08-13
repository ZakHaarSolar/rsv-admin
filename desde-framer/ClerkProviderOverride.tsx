import { ClerkProvider } from "@clerk/clerk-react"
import { ReactNode } from "react"
import type { Override } from "framer"

export function withClerkProvider(): Override {
    return {
        children(props: { children: ReactNode; publishableKey: string }) {
            const key = props.publishableKey || ""

            if (!key) {
                console.warn("⚠️ Clerk: No publishableKey provided")
                return <>{props.children}</>
            }

            return (
                <ClerkProvider
                    publishableKey={key}
                    appearance={{
                        variables: { colorPrimary: "#5ce0d6" },
                    }}
                >
                    {props.children}
                </ClerkProvider>
            )
        },
    }
}
