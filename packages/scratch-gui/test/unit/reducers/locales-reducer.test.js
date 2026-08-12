/* eslint-env jest */
import {localesInitialState} from '../../../src/reducers/locales';

test('provides EasyBlox pt-BR interface translations', () => {
    const ptBrMessages = localesInitialState.messagesByLocale['pt-br'];

    expect(
        ptBrMessages['gui.sharedMessages.loadFromComputerTitle']
    ).toEqual('Carregar do seu computador');

    expect(
        ptBrMessages['gui.menuBar.colorMode']
    ).toEqual('Modo de cor');
        expect(
        ptBrMessages['gui.menuBar.turboModeOn']
    ).toEqual('Ativar modo turbo');

    expect(
        ptBrMessages['gui.menuBar.turboModeOff']
    ).toEqual('Desativar modo turbo');
});
