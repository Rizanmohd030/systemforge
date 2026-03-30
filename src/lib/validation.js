/**
 * Validation Engine
 * Runs sequentially after state updates to detect inconsistencies.
 */

export function runValidation(context) {
    const warnings = []

    // No need to validate if we don't even have a refinement yet
    if (!context.refinement) return warnings

    const { refinement, architecture, stack } = context

    // Rule 1: Architecture vs Refinement features
    if (architecture && refinement.coreFeatures) {
        // Example check: If auth is requested, do we have an auth service?
        const needsAuth = refinement.coreFeatures.some(f => 
            f.toLowerCase().includes('auth') || f.toLowerCase().includes('login') || f.toLowerCase().includes('user')
        )
        const hasAuthService = architecture.services && architecture.services.some(s => 
            s.name.toLowerCase().includes('auth') || s.description.toLowerCase().includes('auth') || s.name.toLowerCase().includes('user')
        )
        // Adjust rule if architecture structure varies
        if (needsAuth && !hasAuthService && architecture.services) {
            warnings.push({
                module: "Architecture",
                message: "⚠ Authentication/User features detected in idea, but architecture lacks a dedicated Auth service."
            })
        }
    }

    // Rule 2: Database requested but not in stack
    if (stack && refinement.coreFeatures) {
        const needsDb = refinement.coreFeatures.some(f => 
            f.toLowerCase().includes('data') || f.toLowerCase().includes('store') || f.toLowerCase().includes('history')
        )
        const hasDb = stack.backend?.database || stack.infrastructure?.database || false
        if (needsDb && !hasDb && stack.backend) {
             warnings.push({
                module: "Tech Stack",
                message: "⚠ Idea requires data storage, but no primary Database was selected in the Tech Stack."
            })
        }
    }

    // Rule 3: Missing prerequisites
    if (architecture && !stack) {
        warnings.push({
            module: "Pipeline",
            message: "⚠ Architecture was generated without an explicit Tech Stack. Results may be generic."
        })
    }

    return warnings
}
