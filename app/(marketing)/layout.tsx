import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "./Header";
import { Footer } from "./footer";

type Props = {
    children: React.ReactNode
}


const MarketingLayout = ({ children }: Props) => {
    return (
        <ClerkProvider>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-items-center">
                    {children}
                </main>
                <Footer />
            </div>
        </ClerkProvider>
    )
};

export default MarketingLayout