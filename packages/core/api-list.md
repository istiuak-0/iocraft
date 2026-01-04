@Register({
in:'component'| 'app'
})
export class ApiListService {
private apiList: string[] = [];

    addApi(api: string): void {
      this.apiList.push(api);
    }

    getApis(): string[] {
      return this.apiList;
    }

}

/// in component or service

  <script setup>
  import { ApiListService } from 'core';

  const apiListService = resolve(ApiListService); // this will work inside a service or component

  const apiListServiceInstance = resolveInstance(ApiListService); // this will work inside a service or component

  const apiListServiceFromContext = resolveFromContext(ApiListService); // this will work inside a  component only
  const apiListServiceFactory = resolveFactory(ApiListService); // this will work inside a service or component


  apilistservicefactory()
  </script>


  