import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";

import LandingPage from "./pages/landing";
import Dashboard from "./pages/dashboard";
import ApplicationsList from "./pages/applications";
import ApplicationForm from "./pages/applications/form";
import ResumesList from "./pages/resumes";
import ResumeForm from "./pages/resumes/form";
import ResumeAnalyze from "./pages/resumes/analyze";
import RecruitersList from "./pages/recruiters";
import InterviewPrep from "./pages/interview-prep";
import Analytics from "./pages/analytics";
import CoverLetter from "./pages/cover-letter";
import NotFound from "./pages/not-found";
import AppLayout from "./components/layout/app-layout";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(0 0% 98%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(240 5% 64.9%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(240 10% 3.9%)",
    colorInput: "hsl(240 10% 12%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(240 10% 12%)",
    fontFamily: '"Inter", -apple-system, sans-serif',
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-background rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-500",
    alertText: "text-destructive",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          {/* Protected Routes */}
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/applications"><ProtectedRoute component={ApplicationsList} /></Route>
          <Route path="/applications/new"><ProtectedRoute component={() => <ApplicationForm isNew />} /></Route>
          <Route path="/applications/:id"><ProtectedRoute component={ApplicationForm} /></Route>
          <Route path="/resumes"><ProtectedRoute component={ResumesList} /></Route>
          <Route path="/resumes/new"><ProtectedRoute component={() => <ResumeForm isNew />} /></Route>
          <Route path="/resumes/:id"><ProtectedRoute component={ResumeForm} /></Route>
          <Route path="/resumes/analyze"><ProtectedRoute component={ResumeAnalyze} /></Route>
          <Route path="/recruiters"><ProtectedRoute component={RecruitersList} /></Route>
          <Route path="/interview-prep"><ProtectedRoute component={InterviewPrep} /></Route>
          <Route path="/analytics"><ProtectedRoute component={Analytics} /></Route>
          <Route path="/cover-letter"><ProtectedRoute component={CoverLetter} /></Route>
          
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="career-pilot-theme">
      <WouterRouter base={basePath}>
        <TooltipProvider>
          <ClerkProviderWithRoutes />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
