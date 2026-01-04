@Register({
in:'app'
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

exposeToChildren(ApiListService); // this will work inside a component only

  const apiListServiceFromContext = resolveFromContext(ApiListService); // this will work inside a  component only // gets the instance exposed to children

const apiListServiceScoped = resolveScoped(ApiListService); // this will work inside a component only


  </script>
