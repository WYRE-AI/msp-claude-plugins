# IT Glue API Patterns — Error Reference

## Error Response Format

```json
{
  "errors": [
    {
      "status": "422",
      "title": "Validation Error",
      "detail": "Name can't be blank",
      "source": {
        "pointer": "/data/attributes/name"
      }
    }
  ]
}
```

## Error Handling Pattern

```javascript
function handleApiError(response) {
  if (!response.errors) return;

  response.errors.forEach(error => {
    console.log(`Error ${error.status}: ${error.title}`);
    console.log(`  Detail: ${error.detail}`);

    if (error.source?.pointer) {
      console.log(`  Field: ${error.source.pointer}`);
    }

    // Suggest fix based on status
    if (error.status === '401') {
      console.log('  Check IT_GLUE_API_KEY environment variable');
    } else if (error.status === '422') {
      console.log('  Verify required fields are provided');
    }
  });
}
```
