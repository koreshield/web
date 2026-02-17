import { motion } from 'framer-motion';

// Inline SVG logos for crisp, themeable icons
const logos = {
    OpenAI: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
    ),
    Anthropic: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M17.304 3.541h-3.476l6.235 16.918h3.476L17.304 3.541zm-10.608 0L.461 20.459h3.558l1.309-3.704h6.262l1.309 3.704h3.558L10.222 3.541H6.696zm1.898 5.143 2.098 5.949H6.496l2.098-5.949z" />
        </svg>
    ),
    Google: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    ),
    Salesforce: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path d="M10.006 5.415a4.195 4.195 0 0 1 3.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.45 0-.884-.06-1.305-.165a3.975 3.975 0 0 1-3.63 2.385 4.05 4.05 0 0 1-1.77-.405 4.62 4.62 0 0 1-4.035 2.37c-2.34 0-4.32-1.74-4.635-4.02a4.463 4.463 0 0 1-.54.045c-2.445 0-4.425-2.01-4.425-4.5s1.98-4.5 4.425-4.5c.705 0 1.365.165 1.965.45a5.106 5.106 0 0 1 5.115-4.95z" />
        </svg>
    ),
    HubSpot: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M18.164 7.93V5.084a2.198 2.198 0 0 0 1.267-1.984v-.066A2.2 2.2 0 0 0 17.23.836h-.066a2.2 2.2 0 0 0-2.198 2.198v.066c0 .87.507 1.617 1.24 1.974v2.862a5.052 5.052 0 0 0-2.348 1.078l-7.775-6.05a2.532 2.532 0 0 0 .096-.684A2.527 2.527 0 1 0 3.652 4.81c.012.39.103.764.262 1.102l-2.759 3.522A2.515 2.515 0 0 0 0 11.52a2.523 2.523 0 0 0 4.112 1.955l2.42-1.918a5.087 5.087 0 0 0-.01.428v.066a5.09 5.09 0 0 0 5.09 5.09 5.052 5.052 0 0 0 2.475-.65l1.854 1.854a1.963 1.963 0 1 0 1.24-1.207l-1.905-1.905a5.06 5.06 0 0 0 1.426-3.533v-.066a5.1 5.1 0 0 0-1.25-3.344l1.8-2.3h2.912zM11.61 14.63a2.579 2.579 0 1 1 0-5.16 2.579 2.579 0 0 1 0 5.16z" />
        </svg>
    ),
    Zendesk: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11.084 0v17.834L0 24V6.166L11.084 0zm1.832 6.166L24 0v17.834L12.916 24V6.166zm0-6.166L24 6.166H12.916V0zM0 17.834L11.084 24H0v-6.166z" />
        </svg>
    ),
    Slack: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
    ),
    LangChain: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4zm-2.4 4.8v9.6h1.8v-3.6h2.4l2.4 3.6h2.1l-2.7-3.9c1.35-.45 2.4-1.65 2.4-3.15 0-1.8-1.5-3.3-3.3-3.3h-4.5v.75zm1.8 1.05h2.7c.99 0 1.5.51 1.5 1.5s-.51 1.5-1.5 1.5h-2.7v-3z" />
        </svg>
    ),
    DeepSeek: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
    ),
};

const integrations = [
    { name: 'OpenAI', Logo: logos.OpenAI },
    { name: 'Anthropic', Logo: logos.Anthropic },
    { name: 'Gemini', Logo: logos.Google },
    { name: 'Salesforce', Logo: logos.Salesforce },
    { name: 'HubSpot', Logo: logos.HubSpot },
    { name: 'Zendesk', Logo: logos.Zendesk },
    { name: 'Slack', Logo: logos.Slack },
    { name: 'LangChain', Logo: logos.LangChain },
    { name: 'DeepSeek', Logo: logos.DeepSeek },
];

// Duplicate for seamless loop
const tickerItems = [...integrations, ...integrations];

export function IntegrationTicker() {
    return (
        <section className="py-10 border-y border-border/60 bg-background backdrop-blur-sm overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10"></div>

            <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    Protecting Data Across Your Stack
                </p>
            </div>

            <div className="flex">
                <motion.div
                    className="flex gap-12 sm:gap-20 items-center whitespace-nowrap"
                    animate={{
                        x: [0, -1200],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 35,
                            ease: "linear",
                        },
                    }}
                >
                    {tickerItems.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity cursor-default"
                            aria-label={item.name}
                        >
                            <span className="text-muted-foreground hover:text-electric-green transition-colors">
                                <item.Logo />
                            </span>
                            <span className="text-xl font-semibold text-foreground/80">{item.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
