import { Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { VolumeMute, VolumeUp } from '../../util';
import { getFieldNameValue } from '../../util/element';
import { SettingDiscord } from './discord';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { settingsSelector, updateSettingsNotification } from '../../store/settings/settings.slice';

function SettingNotifications() {
  const { t } = useTranslation();

  const { notifications } = useAppSelector(settingsSelector).settings;
  const dispatch = useAppDispatch();
  const onUpdate = (e) => {
    const update = getFieldNameValue<boolean>(e,notifications);
    if(update){
      dispatch(updateSettingsNotification(update));
    }
  };

  return (
    <>
      <h5>{t('modal.settings.notification.title')}</h5>
      <ol className='list-group'>
        <li className='list-group-item d-flex justify-content-between align-items-center'>
          <Form.Label className='ms-2 mt-2 me-auto' htmlFor='notifications.onError'>
            <div className='fw-bold'>{t('modal.settings.notification.error')}</div>
          </Form.Label>
          <Form.Check type='switch' name='onError' checked={notifications.onError} onChange={onUpdate} id='notifications.onError' />
        </li>
        <li className='list-group-item d-flex justify-content-between align-items-center'>
          <Form.Label className='ms-2 mt-2 me-auto' htmlFor='notifications.onAction'>
            <div className='fw-bold'>{t('modal.settings.notification.action')} </div>
          </Form.Label>
          <Form.Check type='switch' name='onAction' checked={notifications.onAction} onChange={onUpdate} id='notifications.onAction' />
        </li>
        <li className='list-group-item d-flex justify-content-between align-items-center'>
          <Form.Label className='ms-2 mt-2 me-auto' htmlFor='notifications.onBatch'>
            <div className='fw-bold'>{t('modal.settings.notification.batch')}</div>
          </Form.Label>
          <Form.Check type='switch' name='onBatch' checked={notifications.onBatch} onChange={onUpdate} id='notifications.onBatch' />
        </li>
        <li className='list-group-item d-flex justify-content-between align-items-center'>
          <Form.Label className='ms-2 mt-2 me-auto' htmlFor='notifications.onConfig'>
            <div className='fw-bold'>{t('modal.settings.notification.config')}</div>
          </Form.Label>
          <Form.Check type='switch' name='onConfig' checked={notifications.onConfig} onChange={onUpdate} id='notifications.onConfig' />
        </li>
      </ol>
      <hr />
      <ol className='list-group'>
        <li className='list-group-item d-flex justify-content-between align-items-center'>
          <Form.Label className='ms-2 mt-2 me-auto' htmlFor='notifications.sound'>
            <div className='fw-bold'>
              {t('modal.settings.notification.sound')} <span>{notifications.sound ? <VolumeUp /> : <VolumeMute />}</span>
            </div>
          </Form.Label>
          <Form.Check type='switch' onChange={onUpdate} name='sound' checked={notifications.sound} id='notifications.sound' />
        </li>
        <li className='list-group-item d-flex justify-content-between align-items-center'>
          <SettingDiscord onChange={onUpdate} checked={notifications.discord} label={t('modal.settings.notification.discord.title')} />
        </li>
      </ol>
    </>
  );
}

export { SettingNotifications };
