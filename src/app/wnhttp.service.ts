import {Injectable} from '@angular/core'
import {ConnectionBackend, XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Http, Headers} from '@angular/http'
import {Observable} from 'rxjs/Observable'
import 'rxjs/add/operator/catch'

@Injectable()
export class WnHttp extends Http {

  apiUrl = '/api'

  constructor(private backend: ConnectionBackend, private defaulOptions: RequestOptions) {
    super(backend, defaulOptions)
  }

  get(url: string, options?: RequestOptionsArgs): Observable<any> {
    return super.get(this.apiUrl + url, this.addJwt(options)).map(response => response.json())
  }

  post(url: string, body: any, options?: RequestOptionsArgs): Observable<any> {
    return super.post(this.apiUrl + url, body, this.addJwt(options)).map(response => response.json())
  }

  put(url: string, body: any, options?: RequestOptionsArgs): Observable<any> {
    return super.put(this.apiUrl + url, body, this.addJwt(options)).map(response => response.json())
  }

  delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return super.delete(this.apiUrl + url, this.addJwt(options))
  }

  private addJwt(options?: RequestOptionsArgs): RequestOptionsArgs {
    // ensure request options and headers are not null
    options = options || new RequestOptions()
    options.headers = options.headers || new Headers()

    // add authorization header with jwt token
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))
    if (currentUser && currentUser.token) {
      options.headers.append('Authorization', 'Bearer ' + currentUser.token)
    }

    return options
  }

}

export function wnHttpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions): Http {
  return new WnHttp(xhrBackend, requestOptions)
}

export let wnHttpProvider = {
  provide: WnHttp,
  useFactory: wnHttpFactory,
  deps: [XHRBackend, RequestOptions]
}
