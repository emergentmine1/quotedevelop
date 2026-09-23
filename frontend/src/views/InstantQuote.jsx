'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import {
  Anchor,
  Package,
  Container,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  Shield,
  CheckCircle2,
  Sparkles,
  Truck,
  FileCheck,
  Boxes,
  ArrowRight,
  Plane,
  Ship,
  PackageOpen,
  Train,
  Route,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ports, airports } from '@/lib/mock-data';
import Flag from '@/components/Flag';
import { submitQuoteRequest, mapToQuoteRequestPayload, loadQuoteCodes } from '@/lib/api-client';
import { toast } from 'sonner';
import QuoteSummary from '@/components/QuoteSummary';
import UnitForm from '@/components/UnitForm';
import CityZipAutocomplete from '@/components/CityZipAutocomplete';
import {
  SHIPPING_MODE_OPTIONS,
  CARGO_TYPE_OPTIONS,
  CALCULATION_METHODS,
  PACKAGE_TYPE_OPTIONS,
  CONTAINER_TYPE_OPTIONS,
} from '@/lib/quote-ui-config';

// ---------------- HELPERS ----------------
const CM_PER_IN = 2.54;
const KG_PER_LB = 0.453592;
const CFT_PER_CBM = 35.3147;

const MODE_ICON_MAP = {
  plane: Plane,
  ship: Ship,
  train: Train,
  route: Route,
  default: Circle,
};

const CARGO_ICON_MAP = {
  boxes: Boxes,
  container: Container,
  package: PackageOpen,
  default: PackageOpen,
};

const STEP3_SERVICE_OPTIONS = [
  {
    key: 'customsOrigin',
    icon: FileCheck,
    title: 'Origin customs clearance',
    description: 'We handle export documentation and clearance at origin.',
    testId: 'svc-customs-origin',
    defaultValue: false,
  },
  {
    key: 'customsDestination',
    icon: FileCheck,
    title: 'Destination customs clearance',
    description: 'Import declarations, duties handling and release.',
    testId: 'svc-customs-destination',
    recommended: true,
    defaultValue: true,
  },
  {
    key: 'insurance',
    icon: Shield,
    title: 'Cargo insurance',
    description: 'All-risk coverage at 110% of invoice value.',
    testId: 'svc-insurance',
    recommended: true,
    defaultValue: true,
  },
];

const DEFAULT_STEP3_SERVICES = STEP3_SERVICE_OPTIONS.reduce((acc, option) => {
  acc[option.key] = Boolean(option.defaultValue);
  return acc;
}, {});

function newUnit(defaultPackageType = 'Boxes/Crates') {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
    packageType: defaultPackageType,
    commodity: '',
    units: 1,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    hazardous: false,
  };
}

function newContainerLine(type = '40HQ') {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
    type,
    count: 1,
  };
}


function unitCFT(u, dimUnit) {
  const factor = dimUnit === 'CM' ? 1 / 2.54 : 1;
  const l = u.length * factor;
  const w = u.width * factor;
  const h = u.height * factor;
  return (l * w * h) / 1728; // cubic inches to cubic feet
}

function unitLB(u, weightUnit) {
  return weightUnit === 'KG' ? u.weight / KG_PER_LB : u.weight;
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

function addDaysISO(isoDate, days) {
  const base = new Date(`${isoDate}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toISODate(base);
}

function filterLocationOptions(list, { excludeCode, includeCountryCode, excludeCountryCode } = {}) {
  return list.filter((location) => (
    (!excludeCode || location.code !== excludeCode)
    && (!includeCountryCode || location.countryCode === includeCountryCode)
    && (!excludeCountryCode || location.countryCode !== excludeCountryCode)
  ));
}

// ---------------- PAGE ----------------
export default function InstantQuote() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);

  const calculationMethods = useMemo(() => (Array.isArray(CALCULATION_METHODS) ? CALCULATION_METHODS : []), []);
  const packageTypeOptions = useMemo(() => (Array.isArray(PACKAGE_TYPE_OPTIONS) ? PACKAGE_TYPE_OPTIONS : []), []);
  const containerTypeOptions = useMemo(() => (Array.isArray(CONTAINER_TYPE_OPTIONS) ? CONTAINER_TYPE_OPTIONS : []), []);

  const shippingModes = useMemo(
    () =>
      (Array.isArray(SHIPPING_MODE_OPTIONS) ? SHIPPING_MODE_OPTIONS : []).map((mode) => ({
        ...mode,
        icon: MODE_ICON_MAP[mode.icon] || MODE_ICON_MAP.default,
      })),
    []
  );
  const cargoTypes = useMemo(
    () =>
      (Array.isArray(CARGO_TYPE_OPTIONS) ? CARGO_TYPE_OPTIONS : []).map((cargo) => ({
        ...cargo,
        icon: CARGO_ICON_MAP[cargo.icon] || CARGO_ICON_MAP.default,
      })),
    []
  );
  const enabledShippingModes = useMemo(() => shippingModes.filter((mode) => mode.enabled !== false), [shippingModes]);
  const enabledCargoTypes = useMemo(() => cargoTypes.filter((cargo) => cargo.enabled !== false), [cargoTypes]);

  // Step 1
  const [cargoMode, setCargoMode] = useState(() => enabledCargoTypes[0]?.id || cargoTypes[0]?.id || '');
  const [calcMode, setCalcMode] = useState(() => calculationMethods[0]?.id || 'per-unit');
  const [dimUnit, setDimUnit] = useState('IN');
  const [weightUnit, setWeightUnit] = useState('KG');
  const [units, setUnits] = useState(() => [newUnit(packageTypeOptions[0] || 'Boxes/Crates')]);
  const [totalShipment, setTotalShipment] = useState({ volume: 0, weight: 0, commodity: '' });
  const [containers, setContainers] = useState([newContainerLine('40HQ')]);

  // R1: Commodity / Goods
  const [commodity, setCommodity] = useState('');
  const [commodityError, setCommodityError] = useState('');

  // Step 2
  const [shippingMode, setShippingMode] = useState(() => enabledShippingModes[0]?.id || shippingModes[0]?.id || '');
  // R3: Default origin US-Chicago (config-driven — falls back to hardcoded default until backend is wired)
  const [origin, setOrigin] = useState({ country: 'USA', countryCode: 'US', city: 'Chicago', code: 'ORD', address: '' });
  const [destination, setDestination] = useState({
    country: '',
    countryCode: '',
    city: '',
    code: '',
    address: ''
  });
  const todayDate = toISODate(new Date());
  const [readyDate, setReadyDate] = useState(() => addDaysISO(todayDate, 7));
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState('');
  const [originType, setOriginType] = useState('port'); // port | door
  const [destinationType, setDestinationType] = useState('port');

  // Step 3
  const [services, setServices] = useState(() => ({
    ...DEFAULT_STEP3_SERVICES,
    stackable: false,
    hazardous: false,
  }));

  // R7: Exporter location (Step 4) — persisted with the inquiry
  const [contact, setContact] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    jobTitle: '',
    exporterName: '',
    addressLine1: '',
    addressLine2: '',
    addressDisplay: '',
    city: '',
    state: '',
    postalCode: '',
    countryCode: 'US',
    emailConsent: false,
    commercialCustomer: false,
  });
  const [showExporterLocation] = useState(false);
  const [contactError, setContactError] = useState('');

  const selectedShippingMode = useMemo(
    () => shippingModes.find((mode) => mode.id === shippingMode) || shippingModes[0],
    [shippingModes, shippingMode]
  );
  const selectedCargoType = useMemo(
    () => cargoTypes.find((cargo) => cargo.id === cargoMode) || cargoTypes[0],
    [cargoTypes, cargoMode]
  );
  const isContainerCargo = selectedCargoType?.entryMode === 'container';

  const modeLocations = useMemo(
    () => (selectedShippingMode?.portDataset === 'airports' ? airports : ports),
    [selectedShippingMode?.portDataset]
  );
  const originPortOptions = useMemo(
    () => filterLocationOptions(modeLocations, { excludeCode: destination.code, includeCountryCode: 'US' }),
    [modeLocations, destination.code]
  );
  const destinationPortOptions = useMemo(
    () => filterLocationOptions(modeLocations, { excludeCountryCode: 'US' }),
    [modeLocations]
  );
  const minRequiredDeliveryDate = readyDate ? addDaysISO(readyDate, 1) : todayDate;

  useEffect(() => {
    if (!origin.code) return;
    if (originPortOptions.some((port) => port.code === origin.code)) return;

    const fallback = originPortOptions[0];
    setOrigin((prev) => (fallback
      ? {
          ...prev,
          code: fallback.code,
          city: fallback.city,
          country: fallback.country,
          countryCode: fallback.countryCode,
        }
      : {
          ...prev,
          code: '',
          city: '',
          country: '',
          countryCode: '',
        }));
  }, [origin.code, originPortOptions]);

  useEffect(() => {
    if (!readyDate || !requiredDeliveryDate) return;
    if (requiredDeliveryDate > readyDate) return;
    setRequiredDeliveryDate('');
  }, [readyDate, requiredDeliveryDate]);

  // Totals
  const shipmentTotals = useMemo(() => {
    if (isContainerCargo) {
      const total = containers.reduce((a, c) => a + Number(c.count || 0), 0);
      return { units: total, cft: 0, lb: 0, isContainer: true };
    }
    if (calcMode === 'total') {
      const cft = totalShipment.volume * (dimUnit === 'CM' ? CFT_PER_CBM : 1);
      const lb = totalShipment.weight * (weightUnit === 'KG' ? 1 / KG_PER_LB : 1);
      return { units: 1, cft, lb, isContainer: false };
    }
    const totalUnits = units.reduce((a, u) => a + Number(u.units || 0), 0);
    const cft = units.reduce((a, u) => a + unitCFT(u, dimUnit) * Number(u.units || 0), 0);
    const lb = units.reduce((a, u) => a + unitLB(u, weightUnit) * Number(u.units || 0), 0);
    return { units: totalUnits, cft, lb, isContainer: false };
  }, [isContainerCargo, calcMode, units, dimUnit, weightUnit, totalShipment, containers]);

  const updateUnit = (id, patch) => setUnits((arr) => arr.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  const removeUnit = (id) => setUnits((arr) => (arr.length > 1 ? arr.filter((u) => u.id !== id) : arr));

  const updateContainer = (id, patch) =>
    setContainers((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeContainer = (id) =>
    setContainers((arr) => (arr.length > 1 ? arr.filter((c) => c.id !== id) : arr));
  const addContainer = () => setContainers((arr) => [...arr, newContainerLine('20GP')]);

  const commodityTrimmed = commodity.trim();
  const totalCommodityTrimmed = (totalShipment.commodity || '').trim();
  const perUnitCommodities = units.map((u) => (u.commodity || '').trim());
  const isCommodityValid = isContainerCargo
    ? commodityTrimmed.length >= 2
    : calcMode === 'total'
      ? totalCommodityTrimmed.length >= 2
      : units.length > 0 && perUnitCommodities.every((value) => value.length >= 2);
  const quoteCommodity = isContainerCargo
    ? commodityTrimmed
    : calcMode === 'total'
      ? totalCommodityTrimmed
      : perUnitCommodities.find((value) => value.length >= 2) || '';

  const step1Valid = useMemo(() => {
    if (!isCommodityValid) return false;
    if (isContainerCargo) {
      return containers.length > 0 && containers.every((c) => c.type && Number(c.count) > 0);
    }
    if (calcMode === 'total') return totalShipment.volume > 0 && totalShipment.weight > 0;
    return units.every((u) => u.length > 0 && u.width > 0 && u.height > 0 && u.weight > 0 && u.units > 0);
  }, [isCommodityValid, isContainerCargo, calcMode, totalShipment, units, containers]);

  const step2Valid =
    origin.code &&
    destination.code &&
    readyDate &&
    requiredDeliveryDate &&
    readyDate >= todayDate &&
    requiredDeliveryDate >= todayDate &&
    readyDate < requiredDeliveryDate &&
    origin.code !== destination.code;

  const goNext = (n) => {
    if (n === 2 && !isCommodityValid) {
      setCommodityError('Please describe the commodity / goods you are shipping');
      return toast.error('Commodity is required');
    }
    if (n === 2 && commodityError) {
      setCommodityError('');
    }
    if (n === 2 && !step1Valid) return toast.error('Please complete your shipment details');
    if ((n === 3 || n === 4) && (readyDate < todayDate || requiredDeliveryDate < todayDate)) {
      return toast.error('Dates cannot be in the past');
    }
    if ((n === 3 || n === 4) && readyDate >= requiredDeliveryDate) {
      return toast.error('Required Delivery Date must be later than Goods ready date');
    }
    if (n === 3 && !step2Valid) return toast.error('Please complete pickup and delivery');
    if (n === 4 && !step2Valid) return toast.error('Please complete pickup and delivery');
    setActiveStep(n);
  };

  const buildPayload = () => {
    const perUnitHazardous = !isContainerCargo && calcMode === 'per-unit'
      ? units.some((u) => Boolean(u.hazardous))
      : false;

    return {
      cargoMode,
      shipmentTotals,
      shippingMode,
      origin,
      destination,
      readyDate,
      requiredDeliveryDate,
      originType,
      destinationType,
      services: {
        ...services,
        hazardous: Boolean(services?.hazardous) || perUnitHazardous,
      },
      exporterLocationEnabled: showExporterLocation,
      containers,
      commodity: quoteCommodity,
      customerEmailConsent: Boolean(contact.emailConsent),
      commercialCustomer: Boolean(contact.commercialCustomer),
    };
  };

  const getQuote = async () => {
    if (!step1Valid || !step2Valid) {
      toast.error('Please complete all steps');
      return;
    }
    // R1: Commodity is required
    if (!isCommodityValid) {
      setCommodityError('Please describe the commodity / goods you are shipping');
      setActiveStep(1);
      toast.error('Commodity is required');
      return;
    }
    setCommodityError('');

    // Validate contact per spec (Full Name, Company, Email, Phone required)
    const trimmed = {
      fullName: contact.fullName.trim(),
      company: contact.company.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      jobTitle: contact.jobTitle.trim(),
      exporterName: contact.exporterName.trim() || contact.company.trim(),
      addressLine1: contact.addressLine1.trim(),
      addressLine2: contact.addressLine2.trim(),
      city: contact.city.trim(),
      state: contact.state.trim(),
      postalCode: contact.postalCode.trim(),
      countryCode: contact.countryCode,
    };
    if (!trimmed.fullName) {
      setContactError('Please enter your full name');
      setActiveStep(4);
      return;
    }
    if (!trimmed.company) {
      setContactError('Please enter your company name');
      setActiveStep(4);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed.email)) {
      setContactError('Please enter a valid email address');
      setActiveStep(4);
      return;
    }
    if (!trimmed.phone) {
      setContactError('Please enter your phone number');
      setActiveStep(4);
      return;
    }
    if (!/^[+]?[(]?[0-9]{1,4}[)]?[0-9\s-]{6,}$/.test(trimmed.phone)) {
      setContactError('Please enter a valid phone number');
      setActiveStep(4);
      return;
    }
    if (showExporterLocation) {
      // R7: (city + state) OR (full address)
      const minimalAddress = trimmed.city && trimmed.state;
      const fullAddress = trimmed.addressLine1 && trimmed.city && trimmed.state && trimmed.postalCode;
      if (!minimalAddress && !fullAddress) {
        setContactError('Exporter location requires at least City + State (or a full address)');
        setActiveStep(4);
        return;
      }
    }
    setContactError('');

    const payload = buildPayload();

    // Persist the payload for the results page (client-side pricing / dummy data for now).
    sessionStorage.setItem('iq_payload', JSON.stringify(payload));

    // Best-effort submit to the KWE backend (POST /api/v1/quote-requests).
    // Non-blocking: results render regardless of backend availability.
    try {
      // Resolve real cdcodes (defaults + PKT/ACS/PDT) for an accurate payload; null when offline.
      const resolved = await loadQuoteCodes().catch(() => null);
      const dto = mapToQuoteRequestPayload(payload, trimmed, {
        weightUnit,
        dimUnit,
        calcMode,
        units,
        totalShipment,
        isContainerCargo,
      }, resolved);
      const created = await submitQuoteRequest(dto);
      if (created?.qrref) sessionStorage.setItem('iq_qrref', created.qrref);
    } catch (e) {
      console.warn('[quote-requests] submit failed (backend unreachable?)', e);
    }

    const firstName = trimmed.fullName.split(' ')[0];
    if (!payload.services?.hazardous) {
      toast.success(`Thanks ${firstName} — showing your live rates now.`);
    }
    router.push('/instant-quote/results');
  };

  const quoteSummaryData = useMemo(() => {
    const pickupFrom = origin?.code ? `${origin.city} (${origin.code})` : origin?.city || 'Not selected';
    const deliveryTo = destination?.code ? `${destination.city} (${destination.code})` : destination?.city || 'Not selected';
    const formattedReadyDate = readyDate
      ? new Date(`${readyDate}T00:00:00`).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      : 'Not selected';
    const formattedDeliveryDate = requiredDeliveryDate
      ? new Date(`${requiredDeliveryDate}T00:00:00`).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      : 'Not selected';

    const packageType = isContainerCargo
      ? containers.map((line) => line.type).filter(Boolean).join(', ') || 'Container'
      : Array.from(new Set(units.map((unit) => unit.packageType).filter(Boolean))).join(', ') || 'Package';

    const numberOfUnits = isContainerCargo
      ? containers.reduce((total, line) => total + Number(line.count || 0), 0)
      : shipmentTotals.units;

    const totalWeight = shipmentTotals.lb.toFixed(0);
    const totalVolume = shipmentTotals.cft.toFixed(1);
    const chargeableWeight = !isContainerCargo ? `${Math.max(shipmentTotals.lb, shipmentTotals.cft * 12).toFixed(0)} LB` : null;
    const servicesSelected = Object.values(services).filter(Boolean).length;

    return {
      shippingMode: selectedShippingMode?.name || 'Not selected',
      cargoType: selectedCargoType?.name || 'Not selected',
      commodity: quoteCommodity || 'Not provided',
      pickupFrom,
      pickupCountryCode: origin?.countryCode || '',
      deliveryTo,
      deliveryCountryCode: destination?.countryCode || '',
      readyDate: formattedReadyDate,
      deliveryDate: formattedDeliveryDate,
      packageType,
      numberOfUnits,
      servicesSelected,
      totalWeight,
      weightUnit: 'LB',
      totalVolume,
      volumeUnit: 'CFT',
      chargeableWeight,
    };
  }, [isContainerCargo, calcMode, containers, units, shipmentTotals, selectedShippingMode, selectedCargoType, quoteCommodity, origin, destination, readyDate, requiredDeliveryDate, services]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link href="/instant-quote" className="flex items-center gap-2.5">
                      <BrandLogo className="h-10 w-auto" />
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold mt-0.5">Instant Quote</div>
                      </div>
                    </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-[#0B2545]">How It Works</a>
            <a href="#why-kwe" className="hover:text-[#0B2545]">Why KWE</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#EAF3FF] via-white to-white" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#5BB3FF]/30 blur-3xl" />
        <div className="absolute top-40 -left-20 h-72 w-72 rounded-full bg-[#0B2545]/10 blur-3xl" />

        <div className="relative max-w-[1400px] mx-auto px-6 pt-10 lg:pt-16 pb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#5BB3FF]/40 text-xs font-semibold uppercase tracking-widest text-[#0B2545]">
              <Sparkles className="h-3.5 w-3.5 text-[#1E6AE1]" /> Instant Quote · 24/7
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0B2545] leading-[1.05]">
              Quote Your Shipment<br /><span className="text-[#1E6AE1]">in under 60 seconds.</span>
            </h1>
            <p className="mt-4 text-base lg:text-lg text-slate-600 max-w-2xl">
              Air and door-to-door rates from our global network. No phone calls, no spreadsheets — just clear, competitive pricing on screen.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              {['Live rates from 60+ carriers', 'Door-to-door coverage', 'Customs & insurance options'].map((b) => (
                <div key={b} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#1E6AE1]" /> {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN QUOTE BUILDER */}
      <section className="relative max-w-[1400px] mx-auto px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
          {/* Steps */}
          <div className="space-y-4">
            <Step
              step={1}
              title="Mode & Cargo"
              summary={`${selectedShippingMode?.name || 'Mode'} · ${isContainerCargo ? containers.map((c) => `${c.count}×${c.type}`).join(' + ') : `${shipmentTotals.units} units · ${shipmentTotals.cft.toFixed(1)} CFT · ${shipmentTotals.lb.toFixed(0)} LB`}`}
              active={activeStep === 1}
              complete={activeStep > 1 && step1Valid}
              onClick={() => setActiveStep(1)}
            >
              <div className="mb-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Shipping mode</Label>
                    <div className="grid gap-3">
                      {shippingModes.map((mode) => (
                        <ModeButton
                          key={mode.id}
                          testId={`iq-mode-${mode.id}`}
                          active={shippingMode === mode.id}
                          onClick={() => {
                            if (mode.enabled === false) {
                              toast.info(`${mode.name} is not enabled yet for instant quoting.`);
                              return;
                            }
                            setShippingMode(mode.id);
                          }}
                          icon={mode.icon}
                          title={mode.name}
                          subtitle={mode.eta ? `${mode.description} · ${mode.eta}` : mode.description}
                          disabled={mode.enabled === false}
                        />
                      ))}
                    </div>
                    </div>

                    <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-600">Cargo type</Label>
                    <div className="grid gap-3">
                      {cargoTypes.map((cargo) => (
                        <CargoTypeButton
                          key={cargo.id}
                          testId={`iq-cargo-${cargo.id}`}
                          active={cargoMode === cargo.id}
                          onClick={() => cargo.enabled !== false && setCargoMode(cargo.id)}
                          icon={cargo.icon}
                          title={cargo.name}
                          subtitle={cargo.description}
                        />
                      ))}
                    </div>
                    </div>

                    {/* R1: Container mode keeps a single commodity field */}
                    {isContainerCargo && (
                      <div className="xl:col-span-2 xl:max-w-[640px] mt-1">
                        <Label htmlFor="iq-commodity" className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2 block">
                          Goods/Commodity *
                        </Label>
                        <div className="relative">
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="iq-commodity"
                            data-testid="iq-commodity-input"
                            maxLength={80}
                            value={commodity}
                            onChange={(e) => { setCommodity(e.target.value); if (commodityError) setCommodityError(''); }}
                            placeholder="e.g., 50 cartons of electronic components, palletized, non-hazardous cargo."
                            className="h-11 pl-9 rounded-xl border-slate-200 bg-white"
                          />
                        </div>
                        {commodityError ? (
                          <p data-testid="commodity-error" className="mt-1.5 text-[11px] text-red-600 font-semibold">{commodityError}</p>
                        ) : (
                          <p className="mt-1.5 text-[11px] text-slate-500">Required. Maximum 80 characters.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isContainerCargo ? (
                <UnitForm
                  calcMode={calcMode}
                  onCalcModeChange={setCalcMode}
                  calculationMethods={calculationMethods}
                  dimUnit={dimUnit}
                  weightUnit={weightUnit}
                  onDimUnitChange={setDimUnit}
                  onWeightUnitChange={setWeightUnit}
                  units={units}
                  onUnitChange={updateUnit}
                  onUnitRemove={removeUnit}
                  onAddUnit={() => setUnits((arr) => [...arr, newUnit(packageTypeOptions[0] || 'Boxes/Crates')])}
                  packageTypeOptions={packageTypeOptions}
                  totalShipment={totalShipment}
                  onTotalShipmentChange={setTotalShipment}
                  shipmentTotals={shipmentTotals}

                  services={services}
                  setServices={setServices}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                      Container lines
                    </div>
                    <div className="text-xs text-slate-500">
                      Total: <span className="font-bold text-[#0B2545]">{shipmentTotals.units}</span> container{shipmentTotals.units !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {containers.map((c, idx) => (
                    <ContainerLine
                      key={c.id}
                      idx={idx + 1}
                      line={c}
                      onChange={(patch) => updateContainer(c.id, patch)}
                      onRemove={() => removeContainer(c.id)}
                      canRemove={containers.length > 1}
                      containerTypeOptions={containerTypeOptions}
                    />
                  ))}
                  <button
                    type="button"
                    data-testid="iq-add-container"
                    onClick={addContainer}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#5BB3FF]/50 text-[#1E6AE1] font-semibold text-sm hover:bg-[#EAF3FF] transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add another container type
                  </button>
                </div>
              )}

              <StepFooter onNext={() => goNext(2)} testId="iq-step1-next" />
            </Step>

            <Step
              step={2}
              title="Pickup, Delivery & Ready Date"
              summary={`${origin.code} → ${destination.code} · ready ${readyDate}`}
              active={activeStep === 2}
              complete={activeStep > 2 && step2Valid}
              onClick={() => activeStep > 1 && setActiveStep(2)}
              disabled={!step1Valid}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <LocationCard
                  title="Pickup From"
                  type={originType}
                  setType={setOriginType}
                  location={origin}
                  setLocation={setOrigin}
                  portOptions={originPortOptions}
                  prefix="origin"
                />

                <LocationCard
                  title="Deliver To"
                  type={destinationType}
                  setType={setDestinationType}
                  location={destination}
                  setLocation={setDestination}
                  portOptions={destinationPortOptions}
                  prefix="destination"
                />
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Goods ready date">
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      data-testid="iq-ready-date"
                      type="date"
                      value={readyDate}
                      min={todayDate}
                      onChange={(e) => setReadyDate(e.target.value)}
                      className="h-12 pl-10 rounded-xl border-slate-200"
                    />
                  </div>
                </Field>
                <Field label="Required Delivery Date">
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      data-testid="iq-required-delivery-date"
                      type="date"
                      value={requiredDeliveryDate}
                      disabled={!readyDate}
                      min={minRequiredDeliveryDate}
                      onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                      className="h-12 pl-10 rounded-xl border-slate-200"
                    />
                  </div>
                </Field>
              </div>

              <StepFooter onNext={() => goNext(3)} onBack={() => setActiveStep(1)} testId="iq-step2-next" />
            </Step>

            <Step
              step={3}
              title="Additional Services"
              summary={`${Object.values(services).filter(Boolean).length} services selected`}
              active={activeStep === 3}
              complete={false}
              onClick={() => activeStep > 2 && setActiveStep(3)}
              disabled={!step2Valid}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STEP3_SERVICE_OPTIONS.filter((option) => option.enabled !== false).map((option) => (
                  <ServiceCard
                    key={option.key}
                    icon={option.icon}
                    title={option.title}
                    description={option.description}
                    value={Boolean(services[option.key])}
                    onChange={(v) => setServices((s) => ({ ...s, [option.key]: v }))}
                    testId={option.testId}
                    recommended={option.recommended}
                    warning={option.warning}
                  />
                ))}
              </div>

              <StepFooter
                onBack={() => setActiveStep(2)}
                onNext={() => goNext(4)}
                testId="iq-step3-next"
              />
            </Step>

            <Step
              step={4}
              title="Contact Details"
              summary={contact.fullName ? `${contact.fullName}${contact.company ? ` · ${contact.company}` : ''}` : 'Tell us where to send your quote'}
              active={activeStep === 4}
              complete={false}
              onClick={() => activeStep > 3 && setActiveStep(4)}
              disabled={!step2Valid}
            >
              <p className="text-sm text-slate-500 mb-4">
                KWE requires your contact details to validate and generate the live quote
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldInput
                  label="Full name *"
                  value={contact.fullName}
                  onChange={(v) => setContact((c) => ({ ...c, fullName: v }))}
                  testId="contact-fullname"
                />
                <FieldInput
                  label="Company name *"
                  value={contact.company}
                  onChange={(v) => setContact((c) => ({ ...c, company: v }))}
                  testId="contact-company"
                />
                <FieldInput
                  label="Email address *"
                  type="email"
                  value={contact.email}
                  onChange={(v) => setContact((c) => ({ ...c, email: v }))}
                  testId="contact-email"
                />
                <FieldInput
                  label="Phone *"
                  type="tel"
                  value={contact.phone}
                  onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
                  testId="contact-phone"
                />
                <div className="md:col-span-2">
                  <FieldInput
                    label="Job title (optional)"
                    value={contact.jobTitle}
                    onChange={(v) => setContact((c) => ({ ...c, jobTitle: v }))}
                    testId="contact-jobtitle"
                  />
                </div>
                {/* Address section */}
                <div className="md:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2 block">Address</Label>
                  <div className="flex gap-2 items-start">
                    <div className="w-48 shrink-0">
                      <Select
                        value={contact.countryCode}
                        onValueChange={(v) => setContact((c) => ({ ...c, countryCode: v }))}
                      >
                        <SelectTrigger data-testid="contact-country" className="h-12 rounded-xl border-slate-200 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            ['US', 'United States of America'],
                            ['CA', 'Canada'],
                            ['MX', 'Mexico'],
                            ['GB', 'United Kingdom'],
                            ['DE', 'Germany'],
                            ['FR', 'France'],
                            ['NL', 'Netherlands'],
                            ['CN', 'China'],
                            ['JP', 'Japan'],
                            ['SG', 'Singapore'],
                            ['IN', 'India'],
                            ['HK', 'Hong Kong'],
                            ['AU', 'Australia'],
                            ['BR', 'Brazil'],
                            ['ZA', 'South Africa'],
                          ].map(([code, name]) => (
                            <SelectItem key={code} value={code}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <CityZipAutocomplete
                        testId="contact-city-zip"
                        value={contact.addressDisplay || ''}
                        countryCode={contact.countryCode}
                        onChange={(v) => setContact((c) => ({ ...c, addressDisplay: v, city: v, state: '', postalCode: '' }))}
                        onSelect={(item) => setContact((c) => ({
                          ...c,
                          addressDisplay: `${item.city}, ${item.state}, ${item.zipCode}, ${item.country}`,
                          city: item.city,
                          state: item.state,
                          postalCode: item.zipCode,
                          country: item.country,
                          countryCode: item.countryCode,
                        }))}
                        placeholder="Enter City or Zip code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {contactError && (
                <p className="mt-3 text-xs font-semibold text-red-600" data-testid="contact-error">{contactError}</p>
              )}
              <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500">
                <Shield className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>KWE does not share your details with third parties. Your information is used solely for the intended purpose of generating a record of this quote to your email address.</span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="contact-email-consent"
                    data-testid="contact-email-consent"
                    checked={Boolean(contact.emailConsent)}
                    onChange={(e) => setContact((c) => ({ ...c, emailConsent: Boolean(e.target.checked) }))}
                    className="mt-0.5 h-4 w-4 rounded border border-slate-400 accent-[#1E6AE1]"
                  />
                  <Label htmlFor="contact-email-consent" className="text-sm text-slate-700">
                    The customer consents to receive email communication from KWE
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="contact-commercial-customer"
                    data-testid="contact-commercial-customer"
                    checked={Boolean(contact.commercialCustomer)}
                    onChange={(e) => setContact((c) => ({ ...c, commercialCustomer: Boolean(e.target.checked) }))}
                    className="mt-0.5 h-4 w-4 rounded border border-slate-400 accent-[#1E6AE1]"
                  />
                  <Label htmlFor="contact-commercial-customer" className="text-sm text-slate-700">
                    Are you a commercial customer of KWE?
                  </Label>
                </div>
              </div>

              <StepFooter
                onBack={() => setActiveStep(3)}
                onSubmit={getQuote}
                submitLabel="Get Instant Quote"
                testId="iq-get-quote"
              />
            </Step>
          </div>

          {/* Sticky quote summary */}
          <QuoteSummary summary={quoteSummaryData} onSubmit={getQuote} />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#0B2545] text-white py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-[#5BB3FF] text-xs font-semibold uppercase tracking-[0.2em]">How it works</div>
          <h2 className="mt-2 text-3xl lg:text-4xl font-black tracking-tight">From Quote to Booking in Three Clicks.</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: 1, title: 'Describe your cargo', desc: 'Pallets, boxes or containers — switch between units in CM/IN and KG/LB on the fly.' },
              { n: 2, title: 'Tell us the lane', desc: 'Port-to-port or door-to-door across air services. We support 150+ trade lanes.' },
              { n: 3, title: 'Pick your carrier', desc: 'Compare live prices, transit times and trust scores. Book in one click — no email tag.' },
            ].map((s) => (
              <div key={s.n} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="h-10 w-10 rounded-xl bg-[#1E6AE1] flex items-center justify-center font-black">{s.n}</div>
                <h3 className="mt-4 font-bold text-xl">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-300">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why KWE */}
      <section id="why-kwe" className="py-16">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-5">
          {[
            { v: '60+', l: 'Vetted carriers' },
            { v: '150+', l: 'Trade lanes' },
            { v: '99.99%', l: 'Uptime SLA' },
            { v: '<60s', l: 'Average quote time' },
          ].map((s) => (
            <div key={s.l} className="p-6 rounded-2xl border border-slate-100 bg-white kwe-shadow">
              <div className="text-4xl font-black text-[#0B2545] tracking-tight">{s.v}</div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mt-2 font-semibold">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 text-center text-xs text-slate-400">
        © KWE Freight Network · v1.0 · Instant Quote tool
      </footer>
    </div>
  );
}

// ---------------- SUB COMPONENTS ----------------
function Step({ step, title, summary, active, complete, onClick, disabled, children }) {
  return (
    <div
      data-testid={`iq-step-${step}`}
      className={cn(
        'bg-white rounded-2xl border transition-all duration-200',
        active ? 'border-[#1E6AE1]/40 ring-1 ring-[#1E6AE1]/15 shadow-[0_8px_30px_-12px_rgba(30,106,225,0.18)]' : 'border-slate-100',
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-testid={`iq-step-${step}-toggle`}
        className="w-full px-6 py-5 flex items-center gap-4 text-left"
      >
        <div
          className={cn(
            'h-10 w-10 rounded-xl font-black flex items-center justify-center text-sm shrink-0 transition-colors',
            complete && 'bg-emerald-500 text-white',
            active && !complete && 'bg-[#0B2545] text-white',
            !complete && !active && 'bg-slate-100 text-slate-400'
          )}
        >
          {complete ? <CheckCircle2 className="h-5 w-5" /> : step}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">Step {step}</div>
          <div className="font-bold text-[#0B2545] mt-0.5">{title}</div>
          {!active && summary && <div className="text-xs text-slate-500 mt-1 truncate">{summary}</div>}
        </div>
        <ChevronDown
          className={cn('h-5 w-5 text-slate-400 transition-transform duration-300', active && 'rotate-180')}
        />
      </button>
      {active && <div className="px-6 pb-6 border-t border-slate-100 pt-5">{children}</div>}
    </div>
  );
}

function StepFooter({ onNext, onBack, onSubmit, submitLabel, testId }) {
  return (
    <div className="mt-6 flex items-center justify-between pt-5 border-t border-slate-100">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} className="text-slate-600 gap-1">
          ← Back
        </Button>
      ) : <div />}
      {onSubmit ? (
        <Button data-testid={testId} onClick={onSubmit} className="h-12 px-6 bg-[#1E6AE1] hover:bg-[#1758c2] text-white font-semibold rounded-xl gap-2 active:scale-[0.98] transition-all">
          {submitLabel} <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button data-testid={testId} onClick={onNext} className="h-12 px-6 bg-[#0B2545] hover:bg-[#143a6b] text-white font-semibold rounded-xl gap-2">
          Next step <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function CargoTypeButton({ active, onClick, icon: Icon, title, subtitle, testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'group w-full min-h-[100px] p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3',
        active
          ? 'border-[#1E6AE1] bg-[#EAF3FF] ring-2 ring-[#1E6AE1]/20'
          : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5'
      )}
    >
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', active ? 'bg-[#0B2545] text-[#5BB3FF]' : 'bg-slate-100 text-slate-600')}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm text-[#0B2545]">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </button>
  );
}

function ContainerLine({ idx, line, onChange, onRemove, canRemove, containerTypeOptions }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#0B2545] text-[#5BB3FF] flex items-center justify-center shrink-0">
          <Container className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <div className="font-bold text-[#0B2545]">Container {idx}</div>
          <div className="text-[11px] text-slate-500">Set type and quantity</div>
        </div>
        <div className="ml-auto">
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              data-testid={`iq-remove-container-${idx}`}
              className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 mt-3">
        <Field label="Container type">
          <Select value={line.type} onValueChange={(v) => onChange({ type: v })}>
            <SelectTrigger data-testid={`iq-container-type-${idx}`} className="h-11 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {containerTypeOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <FieldInput
          label="Quantity"
          type="number"
          value={line.count}
          onChange={(v) => onChange({ count: Math.max(1, Number(v) || 1) })}
          testId={`iq-container-count-${idx}`}
        />
      </div>
    </div>
  );
}

function LocationCard({ title, type, setType, location, setLocation, portOptions, prefix }) {
  const portLabel = 'PORT';

  return (
    <div className="p-5 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0B2545]">
          <MapPin className="h-4 w-4 text-[#1E6AE1]" /> {title}
        </div>
        <div className="inline-flex p-0.5 rounded-lg bg-slate-100">
          {[['port', portLabel], ['door', 'Door']].map(([v, l]) => (
            <button
              key={v}
              type="button"
              data-testid={`${prefix}-type-${v}`}
              onClick={() => setType(v)}
              className={cn(
                'px-2.5 py-1 text-xs font-bold rounded-md transition-all',
                type === v ? 'bg-white text-[#0B2545] shadow-sm' : 'text-slate-500'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <Field label={portLabel}>
        <Select
          value={location.code || undefined}
          onValueChange={(code) => {
            const p = portOptions.find((x) => x.code === code);
            if (p) {
              setLocation({
                ...location,
                code,
                city: p.city,
                country: p.country,
                countryCode: p.countryCode
              });
            }
          }}
        >
          <SelectTrigger data-testid={`${prefix}-port-select`} className="h-12 rounded-xl border-slate-200">
          <SelectValue
            placeholder={
              prefix === 'destination'
                ? 'Select Deliver Port'
                : 'Select Pickup Port'
            }
          />
          </SelectTrigger>
          <SelectContent>
           {portOptions.map((p) => (
            <SelectItem key={p.code} value={p.code}>
            <div className="flex items-center gap-2">
            <Flag code={p.countryCode} size={18} />
            <span>{p.code} - {p.city}</span>
            </div>
            </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {type === 'door' && (
        <div className="mt-3">
          <Field label="City / Zip Code">
            <CityZipAutocomplete
              testId={`${prefix}-city-zip`}
              value={location.address}
              countryCode={location.countryCode}
              onChange={(value) => setLocation({ ...location, address: value })}
              onSelect={(item) => setLocation({
                ...location,
                address: `${item.city}, ${item.state}, ${item.zipCode}, ${item.country}`,
                city: item.city,
                state: item.state,
                postalCode: item.zipCode,
                country: item.country,
                countryCode: item.countryCode,
              })}
              placeholder="Type city or zip code"
            />
          </Field>
        </div>
      )}

      {/* Mini location footer with flag and route region */}
      {location.code && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Flag code={location.countryCode} size={16} />
          <span className="font-semibold">
            {location.city}, {location.country}
          </span>
        </div>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, title, subtitle, testId, disabled }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'w-full min-h-[100px] p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 relative',
        active
          ? 'border-[#1E6AE1] bg-[#EAF3FF] ring-2 ring-[#1E6AE1]/20'
          : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5',
        disabled && 'opacity-60 border-dashed'
      )}
    >
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5', active ? 'bg-[#0B2545] text-[#5BB3FF]' : 'bg-slate-100 text-slate-600')}>
        <Icon className="h-[17px] w-[17px]" />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm text-[#0B2545] leading-tight">{title}</div>
        <div className="text-xs text-slate-500 leading-snug mt-0.5">{subtitle}</div>
      </div>
      {disabled && (
        <span className="absolute top-1 right-1 text-[9px] uppercase tracking-widest font-bold text-slate-400 bg-white/70 rounded px-1">Soon</span>
      )}
    </button>
  );
}

function ServiceCard({ icon: Icon, title, description, value, onChange, recommended, warning, testId }) {
  return (
    <label
      className={cn(
        'p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3 hover:-translate-y-0.5',
        value ? 'border-[#1E6AE1] bg-[#EAF3FF]/40 ring-1 ring-[#1E6AE1]/15' : 'border-slate-200 bg-white'
      )}
    >
      <div
        className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
          value ? 'bg-[#0B2545] text-[#5BB3FF]' : warning ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#0B2545] text-sm">{title}</span>
          {recommended && <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Recommended</span>}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
      <Switch data-testid={testId} checked={value} onCheckedChange={onChange} className="mt-1" />
    </label>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FieldInput({ label, type = 'text', value, onChange, testId }) {
  return (
    <Field label={label}>
      <Input
        data-testid={testId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border-slate-200"
      />
    </Field>
  );
}
