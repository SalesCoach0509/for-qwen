import spec from '../backend/contracts/product-spec.json';
import { Interaction, CapabilityName, ExperienceLevel } from './types';
export const taxonomy = spec.taxonomy;
export const profiles = spec.profiles;
export const rubricLibrary = spec.rubric;
export function momentSpec(interaction: Partial<Interaction>) { return taxonomy.find(m => m.id === interaction.interactionType || m.name === interaction.interactionType) || taxonomy.find(m => m.id === 'objection-handling')!; }
export function scenarioContext(interaction: Interaction) {
 const moment = momentSpec(interaction); const level = interaction.experienceLevel || 'Experienced';
 const persona = spec.personas.find(p => (interaction.stakeholderRole || '').toLowerCase().includes(p.role.toLowerCase())) || spec.personas.find(p => p.role === 'Business Leader')!;
 return { performanceMoment: moment, experienceLevel: level, stakeholderSeniority: interaction.stakeholderSeniority || 'Manager', complexityProfile: profiles[level as ExperienceLevel], persona, targetCapability: interaction.focusCapability || moment.capabilities[0] as CapabilityName };
}
