jest.mock('react-native-background-actions',()=>({__esModule:true,default:{start:jest.fn(),stop:jest.fn(),isRunning:jest.fn(()=>true),updateNotification:jest.fn(async()=>{})}}));
import BackgroundService from 'react-native-background-actions';
import { Platform, PermissionsAndroid } from 'react-native';
import { withGenerationBackground, generationProgress, subscribeGeneration, cancelBackgroundGeneration } from '../src/generationBackground';
describe('User-started Android foreground generation',()=>{
  beforeEach(()=>{
    jest.replaceProperty(Platform,'OS','android');jest.spyOn(Platform,'Version','get').mockReturnValue(36);
    jest.spyOn(PermissionsAndroid,'request').mockResolvedValue('granted');
    (BackgroundService.start as jest.Mock).mockImplementation(async task=>{void task();});
    (BackgroundService.stop as jest.Mock).mockResolvedValue(undefined);
  });
  afterEach(()=>jest.restoreAllMocks());
  it('runs generation as a headless foreground task and stops before resolving',async()=>{
    const task=jest.fn(async()=>'proposal');await expect(withGenerationBackground(task)).resolves.toBe('proposal');
    expect(BackgroundService.start).toHaveBeenCalledWith(expect.any(Function),expect.objectContaining({taskName:'StridePlanGeneration',linkingURI:'stride-ai:///'}));expect(BackgroundService.stop).toHaveBeenCalled();
    generationProgress('Generating week 27 of 27…');expect(BackgroundService.updateNotification).toHaveBeenCalledWith({taskDesc:'Generating week 27 of 27…'});
  });
  it('stops the service on failure and rejects duplicate generation',async()=>{
    let finish!:(value:string)=>void;const pending=withGenerationBackground(()=>new Promise<string>(resolve=>{finish=resolve;}));
    await expect(withGenerationBackground(async()=> 'duplicate')).rejects.toThrow('already running');
    // The permission/start await needs one event-loop turn before the task begins.
    await Promise.resolve();await Promise.resolve();finish('done');await pending;
    await expect(withGenerationBackground(async()=>{throw new Error('network failed');})).rejects.toThrow('network failed');expect(BackgroundService.stop).toHaveBeenCalled();
  });
  it('reconnects UI observers to an active job and exposes cancellation after remount',async()=>{
    const onCancel=jest.fn(); let finish!:(value:string)=>void;
    const pending=withGenerationBackground(()=>new Promise<string>(resolve=>{finish=resolve;}),onCancel);
    const listener=jest.fn(); const unsubscribe=subscribeGeneration(listener); expect(listener).toHaveBeenCalledWith('Generating training plan…');
    generationProgress('Generating week 3 of 27…');cancelBackgroundGeneration();expect(onCancel).toHaveBeenCalled();
    await Promise.resolve();await Promise.resolve();finish('done');await pending;expect(listener).toHaveBeenLastCalledWith('');unsubscribe();
  });
});
