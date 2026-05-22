{
    "message": "Lấy thông tin điểm du lịch thành công",
    "status": 200,
    "data": {
        "spot": {
            "id": "46a7398d-386f-4449-af1f-b24dd5667649",
            "category_id": 51,
            "province_code": "37",
            "ward_code": null,
            "slug": "ga-ninh-binh",
            "altitude_m": null,
            "opening_hours": {
                "daily": "07:00-17:00"
            },
            "ticket_price_adult": null,
            "ticket_price_child": null,
            "ticket_currency": "VND",
            "phone": null,
            "email": null,
            "website": null,
            "max_capacity": 600,
            "alert_threshold_pct": 80,
            "rating_avg": "4.33",
            "rating_count": 3,
            "has_vr_360": false,
            "has_ar_support": false,
            "has_audio_guide": false,
            "qr_code_url": null,
            "status": "active",
            "is_featured": false,
            "created_by": null,
            "created_at": "2026-05-08T18:43:49.000Z",
            "updated_at": "2026-05-09T05:23:44.371Z",
            "name": "Ga Ninh Bình",
            "description": "Ga đường sắt chính phục vụ du khách đến Ninh Bình bằng tàu hỏa.",
            "address": "Thành phố Ninh Bình, Ninh Bình",
            "longitude": 105.9746207,
            "latitude": 20.2421142,
            "geojson": {
                "type": "Point",
                "coordinates": [
                    105.9746207,
                    20.2421142
                ]
            },
            "category_name": "Ga tàu",
            "province_name": "Ninh Bình",
            "commune_name": null,
            "current_visitor_count": null,
            "current_capacity_pct": null,
            "capacity_recorded_at": null
        }
    }
}



{
      "name": "8. Điểm đến (Spots)",
      "item": [
        {
          "name": "Danh sách điểm đến",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots?page=1&category_id=50&lang=en&capacity=true",
              "host": ["{{baseUrl}}"],
              "path": ["spots"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "search",
                  "value": "",
                  "disabled": true
                },
                {
                  "key": "category_id",
                  "value": "50"
                },
                {
                  "key": "province_code",
                  "value": "",
                  "disabled": true
                },
                {
                  "key": "status",
                  "value": "active",
                  "disabled": true
                },
                {
                  "key": "is_featured",
                  "value": "true",
                  "disabled": true
                },
                {
                  "key": "rating_min",
                  "value": "4",
                  "disabled": true
                },
                {
                  "key": "sortBy",
                  "value": "created_at",
                  "disabled": true
                },
                {
                  "key": "sortOrder",
                  "value": "DESC",
                  "disabled": true
                },
                {
                  "key": "lang",
                  "value": "en"
                },
                {
                  "key": "capacity",
                  "value": "true"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Danh sách điểm đến ở bản đồ map",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/map?page=1&lng=105.97&radius_km=10&limit=10&lat=20.25&capacity=true",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "map"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "search",
                  "value": "",
                  "disabled": true
                },
                {
                  "key": "category_id",
                  "value": "12",
                  "disabled": true
                },
                {
                  "key": "province_code",
                  "value": "",
                  "disabled": true
                },
                {
                  "key": "status",
                  "value": "active",
                  "disabled": true
                },
                {
                  "key": "is_featured",
                  "value": "true",
                  "disabled": true
                },
                {
                  "key": "rating_min",
                  "value": "4",
                  "disabled": true
                },
                {
                  "key": "sortBy",
                  "value": "created_at",
                  "disabled": true
                },
                {
                  "key": "sortOrder",
                  "value": "DESC",
                  "disabled": true
                },
                {
                  "key": "lng",
                  "value": "105.97"
                },
                {
                  "key": "radius_km",
                  "value": "10"
                },
                {
                  "key": "limit",
                  "value": "10"
                },
                {
                  "key": "lat",
                  "value": "20.25"
                },
                {
                  "key": "capacity",
                  "value": "true"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Điểm đến gần đây",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/nearby?lat=20.25&lng=105.97&radius_km=10",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "nearby"],
              "query": [
                {
                  "key": "lat",
                  "value": "20.25"
                },
                {
                  "key": "lng",
                  "value": "105.97"
                },
                {
                  "key": "radius_km",
                  "value": "10"
                },
                {
                  "key": "limit",
                  "value": "20",
                  "disabled": true
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Điểm đến trong khung tọa độ",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/bbox?min_lat=20.0&max_lat=20.5&min_lng=105.5&max_lng=106.0&bbox=105.95,20.20,106.05,20.35",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "bbox"],
              "query": [
                {
                  "key": "min_lat",
                  "value": "20.0"
                },
                {
                  "key": "max_lat",
                  "value": "20.5"
                },
                {
                  "key": "min_lng",
                  "value": "105.5"
                },
                {
                  "key": "max_lng",
                  "value": "106.0"
                },
                {
                  "key": "bbox",
                  "value": "105.95,20.20,106.05,20.35",
                  "type": "text"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Dữ liệu GeoJSON",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/geojson",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "geojson"]
            }
          },
          "response": []
        },
        {
          "name": "Điểm đến nổi bật",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/featured?limit=10&category_ids=[1,2,3]",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "featured"],
              "query": [
                {
                  "key": "limit",
                  "value": "10"
                },
                {
                  "key": "category_ids",
                  "value": "[1,2,3]"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Lấy điểm đến theo id",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/id/:id?lang=vi",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "id", ":id"],
              "query": [
                {
                  "key": "lang",
                  "value": "vi"
                }
              ],
              "variable": [
                {
                  "key": "id",
                  "value": "b41fc495-e247-4bfd-8795-0eefa8ea70ee"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Lấy điểm đến theo slug",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/:slug",
              "host": ["{{baseUrl}}"],
              "path": ["spots", ":slug"],
              "variable": [
                {
                  "key": "slug",
                  "value": "co-o-hoa-lu-ninh-binh"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Lấy media của điểm đến",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/media",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "media"],
              "query": [
                {
                  "key": "media_type",
                  "value": "image",
                  "disabled": true
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Lấy thuyết minh âm thanh",
          "request": {
            "auth": {
              "type": "noauth"
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/audio-guide?lang=vi",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "audio-guide"],
              "query": [
                {
                  "key": "lang",
                  "value": "vi"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Tạo điểm đến",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name_vi\": \"Tràng An\",\n  \"name_en\": \"Trang An\",\n  \"slug\": \"trang-an\",\n  \"description_vi\": \"Khu danh thắng Tràng An\",\n  \"category_id\": 1,\n  \"province_code\": \"NB\",\n  \"address_vi\": \"Ninh Bình\",\n  \"longitude\": 105.9722,\n  \"latitude\": 20.2506,\n  \"phone\": \"02293000000\",\n  \"email\": \"contact@trangan.vn\",\n  \"website\": \"https://trangan.vn\",\n  \"ticket_price_adult\": 250000,\n  \"ticket_price_child\": 100000,\n  \"ticket_currency\": \"VND\",\n  \"max_capacity\": 5000,\n  \"alert_threshold_pct\": 80,\n  \"has_vr_360\": true,\n  \"has_audio_guide\": true,\n  \"status\": \"active\",\n  \"is_featured\": true\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/spots",
              "host": ["{{baseUrl}}"],
              "path": ["spots"]
            }
          },
          "response": []
        },
        {
          "name": "Cập nhật điểm đến",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name_vi\": \"Tràng An (cập nhật)\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}"]
            }
          },
          "response": []
        },
        {
          "name": "Xoá điểm đến",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}"]
            }
          },
          "response": []
        },
        {
          "name": "Bật/tắt nổi bật",
          "request": {
            "method": "PATCH",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/featured",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "featured"]
            }
          },
          "response": []
        },
        {
          "name": "Thêm media",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "file",
                  "type": "file",
                  "value": null
                },
                {
                  "key": "media_type",
                  "value": "image",
                  "type": "text"
                },
                {
                  "key": "caption",
                  "value": "",
                  "type": "text"
                }
              ]
            },
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/media",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "media"]
            }
          },
          "response": []
        },
        {
          "name": "Thêm media hàng loạt",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "files",
                  "type": "file",
                  "value": null
                }
              ]
            },
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/media/batch",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "media", "batch"]
            }
          },
          "response": []
        },
        {
          "name": "Xoá media",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/media/{{mediaId}}",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "media", "{{mediaId}}"]
            }
          },
          "response": []
        },
        {
          "name": "Đặt media chính",
          "request": {
            "method": "PATCH",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/media/{{mediaId}}/primary",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "media", "{{mediaId}}", "primary"]
            }
          },
          "response": []
        },
        {
          "name": "Cập nhật thông tin media",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"alt_text\": \"Ảnh Tràng An\",\n  \"caption\": \"Cảnh đẹp\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/spots/{{spotId}}/media/{{mediaId}}",
              "host": ["{{baseUrl}}"],
              "path": ["spots", "{{spotId}}", "media", "{{mediaId}}"]
            }
          },
          "response": []
        }
      ]
    }, @/d:/Code/@nb_renew_web_du_lich/code/admin/src/pages/Spots/index.tsx @/d:/Code/@nb_renew_web_du_lich/code/admin/src/pages/Spots/SpotDetailDialog.tsx @/d:/Code/@nb_renew_web_du_lich/code/admin/src/pages/Spots/SpotFormDialog.tsx 