import { useTranslation } from 'react-i18next';
import { Cpu, HardDrive, Network, Shield, Clock, Database, Globe, Server, Zap } from 'lucide-react';

interface ProductSpecificationsProps {
  product: {
    offer_type?: string;
    specs?: Record<string, unknown> | null;
    data_volume?: string;
    voice_volume?: string;
    sms_volume?: string;
    validity?: string;
    speed?: string;
    technology?: string;
    coverage?: string;
    ussd_code?: string;
  };
}

interface SpecItem {
  icon: JSX.Element;
  label: string;
  value: string;
}

export function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const { t } = useTranslation();

  if (!product) {
    return null;
  }

  const specValue = (value: unknown): string =>
    value === null || value === undefined || `${value}`.trim() === ''
      ? ''
      : String(value);

  const renderMobileSpecs = () => {
    const items: SpecItem[] = [];
    
    if (product.data_volume) {
      items.push({
        icon: <Database className="h-5 w-5" />,
        label: t('products.dataVolume'),
        value: product.data_volume,
      });
    }
    
    if (product.voice_volume) {
      items.push({
        icon: <Zap className="h-5 w-5" />,
        label: t('products.voiceVolume'),
        value: product.voice_volume,
      });
    }
    
    if (product.sms_volume) {
      items.push({
        icon: <Globe className="h-5 w-5" />,
        label: t('products.smsVolume'),
        value: product.sms_volume,
      });
    }
    
    if (product.validity) {
      items.push({
        icon: <Clock className="h-5 w-5" />,
        label: t('products.validity'),
        value: product.validity,
      });
    }
    
    if (product.ussd_code) {
      items.push({
        icon: <Server className="h-5 w-5" />,
        label: t('products.ussdCode'),
        value: product.ussd_code,
      });
    }
    
    if (product.coverage) {
      items.push({
        icon: <Network className="h-5 w-5" />,
        label: t('products.coverage'),
        value: product.coverage,
      });
    }
    
    return items;
  };

  const renderHostingSpecs = () => {
    const items: SpecItem[] = [];
    const specs = product.specs ?? {};

    const addSpec = (key: string, icon: JSX.Element, labelKey: string) => {
      const value = specValue(specs[key]);
      if (value) {
        items.push({ icon, label: t(labelKey), value });
      }
    };

    addSpec('cpu', <Cpu className="h-5 w-5" />, 'products.cpu');
    addSpec('ram', <Database className="h-5 w-5" />, 'products.ram');
    addSpec('storage', <HardDrive className="h-5 w-5" />, 'products.storage');
    addSpec('storage_type', <HardDrive className="h-5 w-5" />, 'products.storageType');
    addSpec('bandwidth', <Network className="h-5 w-5" />, 'products.bandwidth');
    addSpec('public_ip', <Globe className="h-5 w-5" />, 'products.publicIp');
    addSpec('backup', <Shield className="h-5 w-5" />, 'products.backup');
    addSpec('data_transfer', <Network className="h-5 w-5" />, 'products.dataTransfer');

    return items;
  };

  const renderFiberSpecs = () => {
    const items: SpecItem[] = [];
    
    if (product.speed) {
      items.push({
        icon: <Zap className="h-5 w-5" />,
        label: t('products.speed'),
        value: product.speed,
      });
    }
    
    if (product.technology) {
      items.push({
        icon: <Network className="h-5 w-5" />,
        label: t('products.technology'),
        value: product.technology,
      });
    }
    
    if (product.coverage) {
      items.push({
        icon: <Globe className="h-5 w-5" />,
        label: t('products.coverage'),
        value: product.coverage,
      });
    }
    
    return items;
  };

  const renderBusinessSpecs = () => {
    const items: SpecItem[] = [];
    const specs = product.specs ?? {};

    const addSpec = (key: string, icon: JSX.Element, labelKey: string) => {
      const value = specValue(specs[key]);
      if (value) {
        items.push({ icon, label: t(labelKey), value });
      }
    };

    addSpec('sla', <Shield className="h-5 w-5" />, 'products.sla');
    addSpec('connectivity', <Network className="h-5 w-5" />, 'products.connectivity');

    if (product.technology) {
      items.push({
        icon: <Server className="h-5 w-5" />,
        label: t('products.technology'),
        value: product.technology,
      });
    }

    addSpec('support', <Shield className="h-5 w-5" />, 'products.support');

    return items;
  };

  const getSpecsByType = () => {
    switch (product.offer_type) {
      case 'MOBILE':
        return renderMobileSpecs();
      case 'HOSTING':
      case 'CLOUD':
        return renderHostingSpecs();
      case 'FIBER':
      case 'INTERNET':
        return renderFiberSpecs();
      case 'BUSINESS_SOLUTION':
        return renderBusinessSpecs();
      default:
        return renderHostingSpecs(); // Default to hosting specs
    }
  };

  const specs = getSpecsByType();

  if (specs.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold dark:text-neutral-100">
        {t('products.specifications')}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {specs.map((spec, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="mt-0.5 flex-shrink-0 text-primary dark:text-primary-300">
              {spec.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {spec.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {spec.value || t('common.notSpecified')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductSpecifications;
