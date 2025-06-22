import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';

interface AddressInfo {
  country?: string;
  city?: string;
  street?: string;
  full?: string;
  name?: string;
  address?: string;
}

interface CustomerProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  joinDate?: string | Timestamp;
  address?: AddressInfo;
  totalSpent?: number;
  totalOrders?: number;
  lastOrder?: string | Timestamp;
}

interface PersonalInformationProps {
  customer: CustomerProfile;
  editedCustomer: CustomerProfile | null;
  isEditing: boolean;
  handleInputChange: (
    field: keyof CustomerProfile | `address.${keyof AddressInfo}`,
    value: string | number | boolean | undefined
  ) => void;
  t: (key: string, options?: { defaultValue?: string | number }) => string;
  textDir: 'ltr' | 'rtl';
  formatTimestamp: (timestamp: Timestamp | string | undefined | null) => string;
  iraqiCities: string[];
}

const PersonalInformation: React.FC<PersonalInformationProps> = ({
  customer,
  editedCustomer,
  isEditing,
  handleInputChange,
  t,
  textDir,
  formatTimestamp,
  iraqiCities,
}) => {
  return (
    <div className="p-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-muted/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-foreground mb-4">{t('personalInformation')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('account.profile.nameLabel')}</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editedCustomer?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1"
                  dir={textDir}
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{customer.name || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('account.profile.emailLabel')}</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedCustomer?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                  dir={textDir}
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{customer.email || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('userInfoStep.phone')}</label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editedCustomer?.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1"
                  dir={textDir}
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{customer.phone || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('joinDate')}</label>
              <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{formatTimestamp(customer.joinDate)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-muted/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-foreground mb-4">{t('addressInformation')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('userInfoStep.country')}</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editedCustomer?.address?.country || ''}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  className="mt-1"
                  dir={textDir}
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{customer.address?.country || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('userInfoStep.city')}</label>
              {isEditing ? (
                <Select
                  value={editedCustomer?.address?.city || ''}
                  onValueChange={(value) => handleInputChange('address.city', value)}
                  dir={textDir}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('checkoutPage.selectCity') || t('userInfoStep.city')} />
                  </SelectTrigger>
                  <SelectContent>
                    {iraqiCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{customer.address?.city || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('userInfoStep.street')}</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editedCustomer?.address?.street || ''}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="mt-1"
                  dir={textDir}
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{customer.address?.street || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-300">{t('fullAddress')}</label>
              {isEditing ? (
                <Textarea
                  value={editedCustomer?.address?.full || ''}
                  onChange={(e) => handleInputChange('address.full', e.target.value)}
                  className="mt-1"
                  rows={3}
                  dir={textDir}
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-foreground" dir={textDir}>{customer.address?.full || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInformation;