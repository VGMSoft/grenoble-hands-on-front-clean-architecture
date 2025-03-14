import { CityPresenter, CityPresenterBuilder, CityPresenterFactory, CityPresenterVM } from '@grenoble-hands-on/web-adapters'
import { GeoPosition, WeatherState } from '@grenoble-hands-on/domain'
import { CITY_PRESENTER_FACTORY } from '@/DependencyInjection'
import { render, RenderResult } from '@testing-library/vue'
import City from '@/views/City.vue'
import { createMemoryHistory, createRouter } from 'vue-router'

describe('CityComponent', () => {

    it('display header with city name', async () => {
        // Given
        const vm = new CityPresenterVM()
        vm.city = { name: 'Grenoble', position: new GeoPosition(45, 5) }

        // When
        const ui = await new CityComponentBuilder()
            .withPresenter(new CityPresenterBuilder(vm).build())
            .build()

        // Then
        const header = ui.getHeader()
        expect(header).toBe('Grenoble')
    })

    it('display daily weather with temperature', async () => {
        // Given
        const vm = new CityPresenterVM()
        vm.dailyWeather = [
            { weather: WeatherState.sunny, temperatureMin: 8, temperatureMax: 15, day: '12/01/2021', unite: 'C' }
        ]

        // When
        const ui = await new CityComponentBuilder()
            .withPresenter(new CityPresenterBuilder(vm).build())
            .build()

        // Then
        const weather = await ui.getDailyWeather()
        expect(weather).toBeTruthy()
        expect(weather.date).toBe('12/01/2021')
        expect(weather.temperatureMax).toBe('15 C°')
        expect(weather.temperatureMin).toBe('8 C°')
    })

    it('display hourly weather with temperature', async () => {
        // Given
        const vm = new CityPresenterVM()
        vm.hourlyWeather = [
            { weather: WeatherState.sunny, temperature: 8, time: '12:00', unite: 'F' }
        ]

        // When
        const ui = await new CityComponentBuilder()
            .withPresenter(new CityPresenterBuilder(vm).build())
            .build()

        // Then
        const weather = await ui.getHourlyWeather()
        expect(weather).toBeTruthy()
        expect(weather.hour).toBe('12:00')
        expect(weather.temperature).toBe('8 F°')
    })

    test('fetch weather on init', async () => {
        const hasFetchDailyWeather = await new Promise(resolve => {
            // Given
            const presenter = new CityPresenterBuilder()
                .withFetchWeather(() => Promise.resolve().then(() => resolve(true)))
                .build()

            // When
            new CityComponentBuilder()
                .withPresenter(presenter)
                .build()
        })
        // Then
        expect(hasFetchDailyWeather).toBe(true)
    })

    test('fetch city on init', async () => {
        const hasFetchCity = await new Promise(resolve => {
            // Given
            const presenter = new CityPresenterBuilder()
                .withFetchCity(() => Promise.resolve().then(() => resolve(true)))
                .build()

            // When
            new CityComponentBuilder()
                .withPresenter(presenter)
                .build()
        })
        // Then
        expect(hasFetchCity).toBe(true)
    })

    test('update weather mode on hourly view select', async () => {
        const requestWithMode = await new Promise(resolve => {
            // Given
            const vm = new CityPresenterVM()
            vm.mode = 'daily'
            const presenter = new CityPresenterBuilder(vm)
                .withUpdateMode((mode) => resolve(mode))
                .build()

            // When
            new CityComponentBuilder()
                .withPresenter(presenter)
                .build()
                .then(ui => {
                    ui.selectHourlyMode()
                })
        })
        // Then
        expect(requestWithMode).toBe('hourly')
    })

    test('update weather mode on daily view select', async () => {
        const requestWithMode = await new Promise(resolve => {
            // Given
            const vm = new CityPresenterVM()
            vm.mode = 'hourly'
            const presenter = new CityPresenterBuilder(vm)
                .withUpdateMode((mode) => resolve(mode))
                .build()

            // When
            new CityComponentBuilder()
                .withPresenter(presenter)
                .build()
                .then(ui => {
                    ui.selectDailyMode()
                })
        })
        // Then
        expect(requestWithMode).toBe('daily')
    })

    test('update temperature unit on celsius select', async () => {
        const requestWithTemperature = await new Promise(resolve => {
            // Given
            const vm = new CityPresenterVM()
            vm.temperatureUnite = 'F'
            const presenter = new CityPresenterBuilder(vm)
                .withUpdateTemperatureUnit((temperatureUnit) => resolve(temperatureUnit))
                .build()

            // When
            new CityComponentBuilder()
                .withPresenter(presenter)
                .build()
                .then(ui => {
                    ui.selectCelsius()
                })
        })
        // Then
        expect(requestWithTemperature).toBe('C')
    })

    test('update temperature unit on fahrenheit select', async () => {
        const requestWithTemperature = await new Promise(resolve => {
            // Given
            const vm = new CityPresenterVM()
            vm.temperatureUnite = 'C'
            const presenter = new CityPresenterBuilder()
                .withUpdateTemperatureUnit((temperatureUnit) => resolve(temperatureUnit))
                .build()

            // When
            new CityComponentBuilder()
                .withPresenter(presenter)
                .build()
                .then(ui => {
                    ui.selectFahrenheit()
                })
        })
        // Then
        expect(requestWithTemperature).toBe('F')
    })
})

class CityComponentBuilder {
    private presenter!: CityPresenter

    withPresenter(presenter: CityPresenter) {
        this.presenter = presenter
        return this
    }

    async build() {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/city/:cityId', component: City }, { path: '/', component: City }]
        })
        await router.push('/city/GRENOBLE')
        await router.isReady()

        const presenterFactory = { build: (_: string) => this.presenter } as CityPresenterFactory
        const screen = render(City, {
            global: {
                plugins: [router],
                provide: {
                    [CITY_PRESENTER_FACTORY as symbol]: presenterFactory
                }
            }
        })
        return new CityComponentWrapper(screen)
    }
}

class CityComponentWrapper {
    constructor(private readonly component: RenderResult) {
    }

    getHeader() {
        return this.component.getByLabelText('city name').textContent
    }

    async getDailyWeather() {
        const weather = this.component.queryAllByRole('row')
        const weatherCol = Array.from(weather[1].querySelectorAll('td').values())
        const date = weatherCol[0].textContent
        const temperatureMax = weatherCol[2].textContent
        const temperatureMin = weatherCol[3].textContent
        return { date, temperatureMax, temperatureMin }
    }

    async getHourlyWeather() {
        const weather = this.component.queryAllByRole('row')
        const weatherCol = Array.from(weather[1].querySelectorAll('td').values())
        const hour = weatherCol[0].textContent
        const temperature = weatherCol[2].textContent
        return { hour, temperature }
    }

    selectHourlyMode() {
        this.component.getByRole('radio', { name: /detailed/i }).click()
    }

    selectDailyMode() {
        this.component.getByRole('radio', { name: /simple/i }).click()
    }

    selectCelsius() {
        this.component.getByRole('radio', { name: /C°/ }).click()
    }

    selectFahrenheit() {
        this.component.getByRole('radio', { name: /F°/ }).click()
    }
}
