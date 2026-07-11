import { z } from 'zod';

declare const BulletCategoryEnum: z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>;
type BulletCategory = z.infer<typeof BulletCategoryEnum>;
declare const SectionNameEnum: z.ZodEnum<["contact", "education", "experience", "projects", "skills", "certificates"]>;
type SectionName = z.infer<typeof SectionNameEnum>;
declare const SECTION_LABELS: Record<SectionName, string>;
declare const SECTION_ORDER: SectionName[];
declare const vaultBulletSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isAIGenerated: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
    keywords: string[];
    isAIGenerated: boolean;
    category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
}, {
    id: string;
    text: string;
    category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    keywords?: string[] | undefined;
    isAIGenerated?: boolean | undefined;
}>;
type VaultBullet = z.infer<typeof vaultBulletSchema>;
declare const contactSchema: z.ZodObject<{
    name: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    linkedin: z.ZodNullable<z.ZodString>;
    github: z.ZodNullable<z.ZodString>;
    leetcode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    portfolio: z.ZodNullable<z.ZodString>;
    names: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    emails: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    phones: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    linkedins: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    githubs: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    leetcodes: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    portfolios: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    name: string | null;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
    leetcode?: string | null | undefined;
    names?: string[] | undefined;
    emails?: string[] | undefined;
    phones?: string[] | undefined;
    linkedins?: string[] | undefined;
    githubs?: string[] | undefined;
    leetcodes?: string[] | undefined;
    portfolios?: string[] | undefined;
}, {
    name: string | null;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
    leetcode?: string | null | undefined;
    names?: string[] | undefined;
    emails?: string[] | undefined;
    phones?: string[] | undefined;
    linkedins?: string[] | undefined;
    githubs?: string[] | undefined;
    leetcodes?: string[] | undefined;
    portfolios?: string[] | undefined;
}>;
type Contact = z.infer<typeof contactSchema>;
declare const educationSchema: z.ZodObject<{
    school: z.ZodString;
    degree: z.ZodString;
    gpa: z.ZodNullable<z.ZodString>;
    startYear: z.ZodNullable<z.ZodNumber>;
    endYear: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    school: string;
    degree: string;
    gpa: string | null;
    startYear: number | null;
    endYear: number | null;
}, {
    school: string;
    degree: string;
    gpa: string | null;
    startYear: number | null;
    endYear: number | null;
}>;
type Education = z.infer<typeof educationSchema>;
declare const extracurricularItemSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    date?: string | null | undefined;
}, {
    title: string;
    description: string;
    id?: string | undefined;
    date?: string | null | undefined;
}>;
type ExtracurricularItem = z.infer<typeof extracurricularItemSchema>;
declare const skillsSchema: z.ZodObject<{
    languages: z.ZodArray<z.ZodString, "many">;
    frameworks: z.ZodArray<z.ZodString, "many">;
    tools: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    languages: string[];
    frameworks: string[];
    tools: string[];
}, {
    languages: string[];
    frameworks: string[];
    tools: string[];
}>;
type Skills = z.infer<typeof skillsSchema>;
declare const certificateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    issuer: z.ZodString;
    url: z.ZodString;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    issuer: string;
    url: string;
    date?: string | undefined;
}, {
    id: string;
    name: string;
    issuer: string;
    url: string;
    date?: string | undefined;
}>;
type Certificate = z.infer<typeof certificateSchema>;
declare const experienceSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    company: z.ZodString;
    role: z.ZodString;
    startDate: z.ZodNullable<z.ZodString>;
    endDate: z.ZodNullable<z.ZodString>;
    current: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        isAIGenerated: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }, {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[];
    current?: boolean | undefined;
}, {
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    id?: string | undefined;
    current?: boolean | undefined;
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
}>;
type Experience = z.infer<typeof experienceSchema>;
declare const experienceEntrySchema: z.ZodEffects<z.ZodObject<{
    company: z.ZodString;
    role: z.ZodString;
    startDate: z.ZodNullable<z.ZodString>;
    endDate: z.ZodNullable<z.ZodString>;
    vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        isAIGenerated: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }, {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }>, "many">>;
    bulletPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[];
    bulletPoints?: string[] | undefined;
}, {
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
    bulletPoints?: string[] | undefined;
}>, {
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[] | {
        id: `${string}-${string}-${string}-${string}-${string}`;
        text: string;
        keywords: never[];
        isAIGenerated: boolean;
    }[];
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    bulletPoints?: string[] | undefined;
}, {
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
    bulletPoints?: string[] | undefined;
}>;
declare const projectSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    title: z.ZodString;
    url: z.ZodNullable<z.ZodString>;
    techStack: z.ZodArray<z.ZodString, "many">;
    vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        isAIGenerated: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }, {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    url: string | null;
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[];
    techStack: string[];
}, {
    title: string;
    url: string | null;
    techStack: string[];
    id?: string | undefined;
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
}>;
type Project = z.infer<typeof projectSchema>;
declare const projectEntrySchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    url: z.ZodNullable<z.ZodString>;
    techStack: z.ZodArray<z.ZodString, "many">;
    vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        isAIGenerated: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }, {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }>, "many">>;
    bulletPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    url: string | null;
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[];
    techStack: string[];
    bulletPoints?: string[] | undefined;
}, {
    title: string;
    url: string | null;
    techStack: string[];
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
    bulletPoints?: string[] | undefined;
}>, {
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[] | {
        id: `${string}-${string}-${string}-${string}-${string}`;
        text: string;
        keywords: never[];
        isAIGenerated: boolean;
    }[];
    title: string;
    url: string | null;
    techStack: string[];
    bulletPoints?: string[] | undefined;
}, {
    title: string;
    url: string | null;
    techStack: string[];
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
    bulletPoints?: string[] | undefined;
}>;
declare const profileSchema: z.ZodObject<{
    contact: z.ZodObject<{
        name: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        linkedin: z.ZodNullable<z.ZodString>;
        github: z.ZodNullable<z.ZodString>;
        leetcode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        portfolio: z.ZodNullable<z.ZodString>;
        names: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        emails: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        phones: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        linkedins: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        githubs: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        leetcodes: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        portfolios: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    }, {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    }>;
    education: z.ZodArray<z.ZodObject<{
        school: z.ZodString;
        degree: z.ZodString;
        gpa: z.ZodNullable<z.ZodString>;
        startYear: z.ZodNullable<z.ZodNumber>;
        endYear: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }, {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }>, "many">;
    experience: z.ZodArray<z.ZodObject<{
        id: z.ZodDefault<z.ZodString>;
        company: z.ZodString;
        role: z.ZodString;
        startDate: z.ZodNullable<z.ZodString>;
        endDate: z.ZodNullable<z.ZodString>;
        current: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            isAIGenerated: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }, {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        current?: boolean | undefined;
    }, {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        id?: string | undefined;
        current?: boolean | undefined;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }>, "many">;
    projects: z.ZodArray<z.ZodObject<{
        id: z.ZodDefault<z.ZodString>;
        title: z.ZodString;
        url: z.ZodNullable<z.ZodString>;
        techStack: z.ZodArray<z.ZodString, "many">;
        vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            isAIGenerated: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }, {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        url: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        techStack: string[];
    }, {
        title: string;
        url: string | null;
        techStack: string[];
        id?: string | undefined;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }>, "many">;
    skills: z.ZodObject<{
        languages: z.ZodArray<z.ZodString, "many">;
        frameworks: z.ZodArray<z.ZodString, "many">;
        tools: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }>;
    certificates: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        issuer: z.ZodString;
        url: z.ZodString;
        date: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        issuer: string;
        url: string;
        date?: string | undefined;
    }, {
        id: string;
        name: string;
        issuer: string;
        url: string;
        date?: string | undefined;
    }>, "many">>;
    extracurriculars: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodDefault<z.ZodString>;
        title: z.ZodString;
        description: z.ZodString;
        date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        description: string;
        date?: string | null | undefined;
    }, {
        title: string;
        description: string;
        id?: string | undefined;
        date?: string | null | undefined;
    }>, "many">>;
    githubUsername: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    contact: {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    };
    education: {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }[];
    experience: {
        id: string;
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        current?: boolean | undefined;
    }[];
    projects: {
        id: string;
        title: string;
        url: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        techStack: string[];
    }[];
    skills: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    };
    certificates: {
        id: string;
        name: string;
        issuer: string;
        url: string;
        date?: string | undefined;
    }[];
    extracurriculars: {
        id: string;
        title: string;
        description: string;
        date?: string | null | undefined;
    }[];
    githubUsername?: string | null | undefined;
}, {
    contact: {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    };
    education: {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }[];
    experience: {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        id?: string | undefined;
        current?: boolean | undefined;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }[];
    projects: {
        title: string;
        url: string | null;
        techStack: string[];
        id?: string | undefined;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }[];
    skills: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    };
    certificates?: {
        id: string;
        name: string;
        issuer: string;
        url: string;
        date?: string | undefined;
    }[] | undefined;
    extracurriculars?: {
        title: string;
        description: string;
        id?: string | undefined;
        date?: string | null | undefined;
    }[] | undefined;
    githubUsername?: string | null | undefined;
}>;
type Profile = z.infer<typeof profileSchema>;
declare const bulletsSchema: z.ZodEffects<z.ZodObject<{
    vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        isAIGenerated: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }, {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }>, "many">>;
    bullets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[];
    bullets?: string[] | undefined;
}, {
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
    bullets?: string[] | undefined;
}>, {
    vaultBullets: {
        id: string;
        text: string;
        keywords: string[];
        isAIGenerated: boolean;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
    }[];
} | {
    vaultBullets: {
        id: `${string}-${string}-${string}-${string}-${string}`;
        text: string;
        keywords: never[];
        isAIGenerated: boolean;
    }[];
}, {
    vaultBullets?: {
        id: string;
        text: string;
        category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        keywords?: string[] | undefined;
        isAIGenerated?: boolean | undefined;
    }[] | undefined;
    bullets?: string[] | undefined;
}>;
declare const summarySchema: z.ZodObject<{
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    summary: string;
}, {
    summary: string;
}>;
declare const SECTION_SCHEMAS: Record<string, z.ZodTypeAny>;
declare const parsedResumeSchema: z.ZodObject<{
    contact: z.ZodObject<{
        name: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        phone: z.ZodNullable<z.ZodString>;
        linkedin: z.ZodNullable<z.ZodString>;
        github: z.ZodNullable<z.ZodString>;
        leetcode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        portfolio: z.ZodNullable<z.ZodString>;
        names: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        emails: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        phones: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        linkedins: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        githubs: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        leetcodes: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        portfolios: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    }, {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    }>;
    education: z.ZodArray<z.ZodObject<{
        school: z.ZodString;
        degree: z.ZodString;
        gpa: z.ZodNullable<z.ZodString>;
        startYear: z.ZodNullable<z.ZodNumber>;
        endYear: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }, {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }>, "many">;
    experience: z.ZodArray<z.ZodEffects<z.ZodObject<{
        company: z.ZodString;
        role: z.ZodString;
        startDate: z.ZodNullable<z.ZodString>;
        endDate: z.ZodNullable<z.ZodString>;
        vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            isAIGenerated: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }, {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }>, "many">>;
        bullets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        bullets?: string[] | undefined;
    }, {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
    }>, {
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[] | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            text: string;
            keywords: never[];
            isAIGenerated: boolean;
        }[];
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        bullets?: string[] | undefined;
    }, {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
    }>, "many">;
    projects: z.ZodArray<z.ZodEffects<z.ZodObject<{
        title: z.ZodString;
        techStack: z.ZodArray<z.ZodString, "many">;
        vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            isAIGenerated: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }, {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }>, "many">>;
        bullets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        url: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        url: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        techStack: string[];
        bullets?: string[] | undefined;
    }, {
        title: string;
        url: string | null;
        techStack: string[];
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
    }>, {
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[] | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            text: string;
            keywords: never[];
            isAIGenerated: boolean;
        }[];
        title: string;
        url: string | null;
        techStack: string[];
        bullets?: string[] | undefined;
    }, {
        title: string;
        url: string | null;
        techStack: string[];
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
    }>, "many">;
    skills: z.ZodObject<{
        languages: z.ZodArray<z.ZodString, "many">;
        frameworks: z.ZodArray<z.ZodString, "many">;
        tools: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    contact: {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    };
    education: {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }[];
    experience: {
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[] | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            text: string;
            keywords: never[];
            isAIGenerated: boolean;
        }[];
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        bullets?: string[] | undefined;
    }[];
    projects: {
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[] | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            text: string;
            keywords: never[];
            isAIGenerated: boolean;
        }[];
        title: string;
        url: string | null;
        techStack: string[];
        bullets?: string[] | undefined;
    }[];
    skills: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    };
}, {
    contact: {
        name: string | null;
        email: string | null;
        phone: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
        leetcode?: string | null | undefined;
        names?: string[] | undefined;
        emails?: string[] | undefined;
        phones?: string[] | undefined;
        linkedins?: string[] | undefined;
        githubs?: string[] | undefined;
        leetcodes?: string[] | undefined;
        portfolios?: string[] | undefined;
    };
    education: {
        school: string;
        degree: string;
        gpa: string | null;
        startYear: number | null;
        endYear: number | null;
    }[];
    experience: {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
    }[];
    projects: {
        title: string;
        url: string | null;
        techStack: string[];
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
        bullets?: string[] | undefined;
    }[];
    skills: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    };
}>;
declare const tailorOutputSchema: z.ZodObject<{
    summary: z.ZodNullable<z.ZodString>;
    experience: z.ZodArray<z.ZodObject<{
        company: z.ZodString;
        role: z.ZodString;
        startDate: z.ZodNullable<z.ZodString>;
        endDate: z.ZodNullable<z.ZodString>;
        vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            isAIGenerated: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }, {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
    }, {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }>, "many">;
    projects: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        techStack: z.ZodArray<z.ZodString, "many">;
        vaultBullets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            category: z.ZodOptional<z.ZodEnum<["FRONTEND", "BACKEND", "DEVOPS", "LEADERSHIP", "GENERAL"]>>;
            keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            isAIGenerated: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }, {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }>, "many">>;
        url: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        url: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        techStack: string[];
    }, {
        title: string;
        url: string | null;
        techStack: string[];
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }>, "many">;
    skills: z.ZodObject<{
        languages: z.ZodArray<z.ZodString, "many">;
        frameworks: z.ZodArray<z.ZodString, "many">;
        tools: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    experience: {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
    }[];
    projects: {
        title: string;
        url: string | null;
        vaultBullets: {
            id: string;
            text: string;
            keywords: string[];
            isAIGenerated: boolean;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
        }[];
        techStack: string[];
    }[];
    skills: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    };
    summary: string | null;
}, {
    experience: {
        company: string;
        role: string;
        startDate: string | null;
        endDate: string | null;
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }[];
    projects: {
        title: string;
        url: string | null;
        techStack: string[];
        vaultBullets?: {
            id: string;
            text: string;
            category?: "FRONTEND" | "BACKEND" | "DEVOPS" | "LEADERSHIP" | "GENERAL" | undefined;
            keywords?: string[] | undefined;
            isAIGenerated?: boolean | undefined;
        }[] | undefined;
    }[];
    skills: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    };
    summary: string | null;
}>;
declare const bulletSelectionSchema: z.ZodObject<{
    selectedExperienceIds: z.ZodArray<z.ZodString, "many">;
    selectedProjectIds: z.ZodArray<z.ZodString, "many">;
    selections: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
    skills: z.ZodOptional<z.ZodObject<{
        languages: z.ZodArray<z.ZodString, "many">;
        frameworks: z.ZodArray<z.ZodString, "many">;
        tools: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }, {
        languages: string[];
        frameworks: string[];
        tools: string[];
    }>>;
    rationale: z.ZodString;
}, "strip", z.ZodTypeAny, {
    selectedExperienceIds: string[];
    selectedProjectIds: string[];
    selections: Record<string, string[]>;
    rationale: string;
    skills?: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    } | undefined;
}, {
    selectedExperienceIds: string[];
    selectedProjectIds: string[];
    selections: Record<string, string[]>;
    rationale: string;
    skills?: {
        languages: string[];
        frameworks: string[];
        tools: string[];
    } | undefined;
}>;
interface TailoredOutput {
    summary: string | null;
    experience: Experience[];
    projects: Project[];
    skills: Skills;
}
interface GitHubRepoInfo {
    name: string;
    description: string | null;
    url: string;
    language: string | null;
    stars: number;
}
interface AiGeneratedProject {
    title: string;
    url: string | null;
    techStack: string[];
    bulletPoints: string[];
}
interface AiGeneratedExperience {
    company: string;
    role: string;
    startDate: string | null;
    endDate: string | null;
    bulletPoints: string[];
}
type SectionType = "experience" | "projects" | "skills" | "summary" | "project" | "experience_entry";

export { type AiGeneratedExperience, type AiGeneratedProject, type BulletCategory, BulletCategoryEnum, type Certificate, type Contact, type Education, type Experience, type ExtracurricularItem, type GitHubRepoInfo, type Profile, type Project, SECTION_LABELS, SECTION_ORDER, SECTION_SCHEMAS, type SectionName, SectionNameEnum, type SectionType, type Skills, type TailoredOutput, type VaultBullet, bulletSelectionSchema, bulletsSchema, certificateSchema, contactSchema, educationSchema, experienceEntrySchema, experienceSchema, extracurricularItemSchema, parsedResumeSchema, profileSchema, projectEntrySchema, projectSchema, skillsSchema, summarySchema, tailorOutputSchema, vaultBulletSchema };
