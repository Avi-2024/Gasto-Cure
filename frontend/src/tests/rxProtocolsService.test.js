import { describe, it, expect, beforeEach } from 'vitest';
import { rxProtocolsService, DEFAULT_RX_PROTOCOLS } from '../services/rxProtocolsService';

describe('rxProtocolsService', () => {
  beforeEach(() => {
    localStorage.clear();
    rxProtocolsService.reset();
  });

  it('loads all standard default clinical protocols', () => {
    const protocols = rxProtocolsService.getAll();
    expect(protocols.length).toBe(DEFAULT_RX_PROTOCOLS.length);
    expect(protocols.some((p) => p.id === 'proto-gerd')).toBe(true);
    expect(protocols.some((p) => p.id === 'proto-ibs')).toBe(true);
    expect(protocols.some((p) => p.id === 'proto-fatty-liver')).toBe(true);
    expect(protocols.some((p) => p.id === 'proto-hpylori')).toBe(true);
  });

  it('retrieves a protocol by ID', () => {
    const gerd = rxProtocolsService.getById('proto-gerd');
    expect(gerd).not.toBeNull();
    expect(gerd.title).toContain('GERD');
    expect(gerd.medicines.length).toBeGreaterThanOrEqual(2);
    expect(gerd.diagnosis).toBeDefined();
    expect(gerd.advice).toBeDefined();
  });

  it('returns null for non-existent protocol ID', () => {
    expect(rxProtocolsService.getById('non-existent')).toBeNull();
    expect(rxProtocolsService.getById('')).toBeNull();
  });

  it('allows saving and persisting a custom protocol', () => {
    const custom = {
      title: 'Post-Cholecystectomy Syndrome Kit',
      shortName: 'Post-Cholecystectomy',
      category: 'Hepatobiliary',
      diagnosis: 'Post-Cholecystectomy Syndrome / Bile Gastritis',
      symptoms: 'Nausea, Right upper quadrant pain, Bile reflux',
      medicines: [
        {
          name: 'Cholestyramine 4g',
          frequency: '1-0-1',
          duration: '14 Days',
          remarks: 'Mix in water before meals',
        },
      ],
      advice: 'Low fat diet, frequent small meals',
      followUpDays: 14,
    };

    const saved = rxProtocolsService.save(custom);
    expect(saved).not.toBeNull();
    expect(saved.id).toBeDefined();

    const all = rxProtocolsService.getAll();
    expect(all.length).toBe(DEFAULT_RX_PROTOCOLS.length + 1);

    const retrieved = rxProtocolsService.getById(saved.id);
    expect(retrieved.title).toBe(custom.title);
  });

  it('allows deleting a protocol and resetting to defaults', () => {
    const custom = rxProtocolsService.save({
      title: 'Temporary Test Protocol',
      medicines: [],
    });
    expect(rxProtocolsService.getById(custom.id)).not.toBeNull();

    rxProtocolsService.delete(custom.id);
    expect(rxProtocolsService.getById(custom.id)).toBeNull();

    rxProtocolsService.reset();
    expect(rxProtocolsService.getAll().length).toBe(DEFAULT_RX_PROTOCOLS.length);
  });
});
